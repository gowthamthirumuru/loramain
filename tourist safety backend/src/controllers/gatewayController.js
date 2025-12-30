/**
 * Gateway Controller
 * Handles communication with the LoRa Master Node (Gateway)
 */

const Anchor = require('../models/Anchor');
const Tourist = require('../models/Tourist');
const LocationLog = require('../models/LocationLog');
const SOSAlert = require('../models/SOSAlert');
const socketService = require('../utils/socketService');
const logger = require('../utils/logger');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { SOCKET_EVENTS, LIMITS, TOURIST_STATUS } = require('../config/constants');

/**
 * Gateway Heartbeat - Updates master node status
 * POST /api/gateway/heartbeat
 */
exports.heartbeat = asyncHandler(async (req, res) => {
    const { anchor_id, firmware_version, stats } = req.body;

    let anchor = await Anchor.findOne({ anchor_id: anchor_id || 'MASTER' });

    if (!anchor) {
        // Create master anchor if doesn't exist
        anchor = new Anchor({
            anchor_id: anchor_id || 'MASTER',
            name: 'Master Gateway',
            local_position: { x: 0, y: 0 },
            is_master: true
        });
    }

    anchor.last_heartbeat = new Date();
    anchor.status = 'online';
    if (firmware_version) anchor.hardware.firmware_version = firmware_version;
    if (stats) {
        anchor.stats = { ...anchor.stats, ...stats };
    }

    await anchor.save();

    logger.info('Gateway heartbeat received', { anchor_id: anchor.anchor_id });

    res.json(successResponse({
        anchor_id: anchor.anchor_id,
        status: 'online',
        server_time: new Date().toISOString()
    }, 'Heartbeat acknowledged'));
});

/**
 * Batch Location Update - Process multiple locations at once
 * POST /api/gateway/batch-update
 */
exports.batchUpdate = asyncHandler(async (req, res) => {
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
        throw new ApiError(400, 'locations array is required', 'VALIDATION_ERROR');
    }

    if (locations.length > LIMITS.MAX_BATCH_SIZE) {
        throw new ApiError(400, `Maximum ${LIMITS.MAX_BATCH_SIZE} locations per batch`, 'BATCH_LIMIT_EXCEEDED');
    }

    const results = {
        processed: 0,
        failed: 0,
        errors: []
    };

    for (const loc of locations) {
        try {
            const { device_id, lat, lng, rssi, sos_flag, timestamp } = loc;

            // Find tourist
            const tourist = await Tourist.findOne({
                device_id,
                status: { $ne: TOURIST_STATUS.FINISHED }
            });

            if (!tourist) {
                results.failed++;
                results.errors.push({ device_id, error: 'Device not registered' });
                continue;
            }

            // Save location log
            await LocationLog.create({
                device_id,
                tourist_id: tourist._id,
                latitude: lat,
                longitude: lng,
                rssi,
                is_sos: sos_flag || false,
                timestamp: timestamp ? new Date(timestamp) : new Date()
            });

            // Update tourist status
            tourist.last_location = { lat, lng };
            tourist.last_seen = new Date();

            if (sos_flag) {
                tourist.status = TOURIST_STATUS.SOS;
                await SOSAlert.create({
                    tourist_id: tourist._id,
                    device_id,
                    location: { lat, lng }
                });
                logger.logSOS(tourist.name, device_id, { lat, lng });
            } else {
                tourist.status = TOURIST_STATUS.ACTIVE;
            }

            await tourist.save();
            results.processed++;

            // Emit real-time update
            try {
                const io = socketService.getIO();
                io.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
                    tourist_id: tourist._id,
                    name: tourist.name,
                    lat,
                    lng,
                    status: tourist.status,
                    sos: sos_flag || false
                });
            } catch (err) {
                // Socket error, continue processing
            }

        } catch (err) {
            results.failed++;
            results.errors.push({ device_id: loc.device_id, error: err.message });
        }
    }

    logger.info(`Batch update: ${results.processed} processed, ${results.failed} failed`);

    res.json(successResponse(results, 'Batch update completed'));
});

/**
 * Get Gateway Configuration (Anchor positions)
 * GET /api/gateway/config
 */
exports.getConfig = asyncHandler(async (req, res) => {
    const anchors = await Anchor.find().select('anchor_id name local_position gps_position is_master');

    const config = {
        anchors: anchors.reduce((acc, a) => {
            acc[a.anchor_id] = {
                x: a.local_position.x,
                y: a.local_position.y,
                gps: a.gps_position,
                is_master: a.is_master
            };
            return acc;
        }, {}),
        settings: {
            update_interval_ms: 2000,
            offline_threshold_ms: LIMITS.OFFLINE_THRESHOLD_MS
        }
    };

    res.json(successResponse(config));
});

/**
 * Update Anchor Status
 * PUT /api/gateway/anchors/:id/status
 */
exports.updateAnchorStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, stats } = req.body;

    const anchor = await Anchor.findOne({ anchor_id: id.toUpperCase() });

    if (!anchor) {
        throw new ApiError(404, 'Anchor not found', 'NOT_FOUND');
    }

    if (status) anchor.status = status;
    if (stats) anchor.stats = { ...anchor.stats, ...stats };
    anchor.last_heartbeat = new Date();

    await anchor.save();

    // Emit anchor status update
    try {
        const io = socketService.getIO();
        io.emit(SOCKET_EVENTS.ANCHOR_STATUS, {
            anchor_id: anchor.anchor_id,
            status: anchor.status,
            last_heartbeat: anchor.last_heartbeat
        });
    } catch (err) {
        // Ignore socket errors
    }

    res.json(successResponse(anchor, 'Anchor status updated'));
});

/**
 * Get All Anchors
 * GET /api/gateway/anchors
 */
exports.getAllAnchors = asyncHandler(async (req, res) => {
    const anchors = await Anchor.find().sort({ is_master: -1, anchor_id: 1 });
    res.json(successResponse(anchors));
});

/**
 * Register/Update Anchor
 * POST /api/gateway/anchors
 */
exports.registerAnchor = asyncHandler(async (req, res) => {
    const { anchor_id, name, local_position, gps_position, is_master } = req.body;

    if (!anchor_id || !name || !local_position) {
        throw new ApiError(400, 'anchor_id, name, and local_position are required', 'VALIDATION_ERROR');
    }

    let anchor = await Anchor.findOne({ anchor_id: anchor_id.toUpperCase() });

    if (anchor) {
        // Update existing
        anchor.name = name;
        anchor.local_position = local_position;
        if (gps_position) anchor.gps_position = gps_position;
        if (is_master !== undefined) anchor.is_master = is_master;
    } else {
        // Create new
        anchor = new Anchor({
            anchor_id: anchor_id.toUpperCase(),
            name,
            local_position,
            gps_position,
            is_master: is_master || false
        });
    }

    await anchor.save();
    logger.info(`Anchor registered: ${anchor.anchor_id}`);

    res.status(anchor.isNew ? 201 : 200).json(successResponse(anchor,
        anchor.isNew ? 'Anchor registered' : 'Anchor updated'
    ));
});
