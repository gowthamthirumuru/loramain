/**
 * Gateway Controller
 * Handles communication with the LoRa Master Node (Gateway)
 */

const { prisma } = require('../config/db');
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
    const targetAnchorId = anchor_id || 'MASTER';

    let anchor = await prisma.anchor.findUnique({
        where: { anchor_id: targetAnchorId }
    });

    if (!anchor) {
        // Create master anchor if doesn't exist
        anchor = await prisma.anchor.create({
            data: {
                anchor_id: targetAnchorId,
                name: 'Master Gateway',
                local_position: { x: 0, y: 0 },
                is_master: true,
                status: 'online',
                last_heartbeat: new Date(),
                hardware: firmware_version ? { firmware_version } : {},
                stats: stats || {}
            }
        });
    } else {
        // Update existing
        const updateData = {
            last_heartbeat: new Date(),
            status: 'online'
        };

        if (firmware_version) {
            updateData.hardware = { ...(anchor.hardware || {}), firmware_version };
        }
        if (stats) {
            updateData.stats = { ...(anchor.stats || {}), ...stats };
        }

        anchor = await prisma.anchor.update({
            where: { id: anchor.id },
            data: updateData
        });
    }

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
            const tourist = await prisma.tourist.findUnique({
                where: { device_id }
            });

            if (!tourist || tourist.status === TOURIST_STATUS.FINISHED) {
                results.failed++;
                results.errors.push({ device_id, error: 'Device not registered or finished' });
                continue;
            }

            // Save location log
            await prisma.locationLog.create({
                data: {
                    device_id,
                    tourist_id: tourist.id,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    x: 0, // Fallback if not provided
                    y: 0, // Fallback
                    rssi: parseFloat(rssi),
                    is_sos: sos_flag || false,
                    timestamp: timestamp ? new Date(timestamp) : new Date()
                }
            });

            // Update tourist status
            let updateData = {
                last_location: { lat, lng },
                last_seen: new Date()
            };

            if (sos_flag) {
                updateData.status = TOURIST_STATUS.SOS;

                await prisma.sOSAlert.create({
                    data: {
                        tourist_id: tourist.id,
                        device_id,
                        location: { lat, lng }
                    }
                });
                logger.logSOS(tourist.name, device_id, { lat, lng });
            } else {
                if (tourist.status !== TOURIST_STATUS.SOS) {
                    updateData.status = TOURIST_STATUS.ACTIVE;
                }
            }

            const updatedTourist = await prisma.tourist.update({
                where: { id: tourist.id },
                data: updateData
            });

            results.processed++;

            // Emit real-time update
            try {
                const io = socketService.getIO();
                io.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
                    tourist_id: updatedTourist.id,
                    name: updatedTourist.name,
                    lat,
                    lng,
                    status: updatedTourist.status,
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
    const anchors = await prisma.anchor.findMany();

    const config = {
        anchors: anchors.reduce((acc, a) => {
            acc[a.anchor_id] = {
                x: a.local_position?.x || 0,
                y: a.local_position?.y || 0,
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

    let anchor = await prisma.anchor.findUnique({
        where: { anchor_id: id.toUpperCase() }
    });

    if (!anchor) {
        throw new ApiError(404, 'Anchor not found', 'NOT_FOUND');
    }

    const updateData = {
        last_heartbeat: new Date()
    };
    if (status) updateData.status = status;
    if (stats) updateData.stats = { ...(anchor.stats || {}), ...stats };

    anchor = await prisma.anchor.update({
        where: { id: anchor.id },
        data: updateData
    });

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
    const anchors = await prisma.anchor.findMany({
        orderBy: [
            { is_master: 'desc' },
            { anchor_id: 'asc' }
        ]
    });
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

    const targetId = anchor_id.toUpperCase();

    let anchor = await prisma.anchor.findUnique({
        where: { anchor_id: targetId }
    });

    if (anchor) {
        // Update existing
        const updateData = {
            name,
            local_position,
            is_master: is_master !== undefined ? is_master : anchor.is_master
        };
        if (gps_position) updateData.gps_position = gps_position;

        anchor = await prisma.anchor.update({
            where: { id: anchor.id },
            data: updateData
        });
    } else {
        // Create new
        anchor = await prisma.anchor.create({
            data: {
                anchor_id: targetId,
                name,
                local_position,
                gps_position,
                is_master: is_master || false
            }
        });
    }

    logger.info(`Anchor registered: ${anchor.anchor_id}`);

    res.status(200).json(successResponse(anchor, 'Anchor registered/updated'));
});
