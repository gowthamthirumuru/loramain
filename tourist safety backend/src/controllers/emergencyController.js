/**
 * Emergency Controller
 * Handles emergency incident operations
 */

const Emergency = require('../models/Emergency');
const ResponseTeam = require('../models/ResponseTeam');
const Tourist = require('../models/Tourist');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const socketService = require('../utils/socketService');
const logger = require('../utils/logger');

/**
 * Get All Emergencies
 * GET /api/emergencies
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, severity, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const emergencies = await Emergency.find(filter)
        .populate('touristId', 'name phone device_id')
        .populate('teamId', 'name type status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Emergency.countDocuments(filter);

    res.json(successResponse({
        emergencies,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }));
});

/**
 * Get Emergency by ID
 * GET /api/emergencies/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const emergency = await Emergency.findById(req.params.id)
        .populate('touristId')
        .populate('teamId');

    if (!emergency) {
        throw new ApiError(404, 'Emergency not found', 'NOT_FOUND');
    }

    res.json(successResponse(emergency));
});

/**
 * Create New Emergency
 * POST /api/emergencies
 */
exports.create = asyncHandler(async (req, res) => {
    const { type, severity, location, coordinates, tourist, touristId, assignedTeam, teamId } = req.body;

    const emergency = new Emergency({
        type,
        severity: severity || 'high',
        location,
        coordinates,
        tourist,
        touristId,
        assignedTeam: assignedTeam || 'Unassigned',
        teamId,
        timeElapsed: '0 min'
    });

    await emergency.save();
    logger.info(`Emergency created: ${type} at ${location}`);

    // Emit real-time event
    try {
        const io = socketService.getIO();
        io.to('sos_alerts').emit('emergency_created', emergency);
    } catch (err) {
        logger.error('Socket emit error:', err.message);
    }

    res.status(201).json(successResponse(emergency, 'Emergency created'));
});

/**
 * Update Emergency Status
 * PATCH /api/emergencies/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['dispatched', 'in_progress', 'searching', 'resolved'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Valid values: ${validStatuses.join(', ')}`, 'INVALID_STATUS');
    }

    const emergency = await Emergency.findById(id);
    if (!emergency) {
        throw new ApiError(404, 'Emergency not found', 'NOT_FOUND');
    }

    emergency.status = status;
    await emergency.save();

    // Emit real-time update
    try {
        const io = socketService.getIO();
        io.emit('emergency_updated', { id, status });
    } catch (err) {
        logger.error('Socket emit error:', err.message);
    }

    logger.info(`Emergency ${id} status updated to ${status}`);
    res.json(successResponse(emergency, 'Status updated'));
});

/**
 * Resolve Emergency
 * PATCH /api/emergencies/:id/resolve
 */
exports.resolve = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    const emergency = await Emergency.findById(id);
    if (!emergency) {
        throw new ApiError(404, 'Emergency not found', 'NOT_FOUND');
    }

    emergency.status = 'resolved';
    emergency.resolvedAt = new Date();
    if (notes) emergency.notes = notes;
    await emergency.save();

    // Release assigned team if any
    if (emergency.teamId) {
        await ResponseTeam.findByIdAndUpdate(emergency.teamId, {
            status: 'available',
            currentAssignment: null,
            eta: null
        });
    }

    // Update tourist status back to active
    if (emergency.touristId) {
        await Tourist.findByIdAndUpdate(emergency.touristId, { status: 'active' });
    }

    // Emit real-time event
    try {
        const io = socketService.getIO();
        io.emit('emergency_resolved', { id });
    } catch (err) {
        logger.error('Socket emit error:', err.message);
    }

    logger.info(`Emergency ${id} resolved`);
    res.json(successResponse(emergency, 'Emergency resolved'));
});

module.exports = exports;
