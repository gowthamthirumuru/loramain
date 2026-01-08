/**
 * Alert Controller
 * Handles CRUD operations for alerts
 */

const Alert = require('../models/Alert');
const ResponseTeam = require('../models/ResponseTeam');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get All Alerts
 * GET /api/alerts
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, severity, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alerts = await Alert.find(filter)
        .populate('assignedTeam', 'name type status')
        .populate('touristId', 'name phone')
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Alert.countDocuments(filter);

    res.json(successResponse({
        alerts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }));
});

/**
 * Get Alert by ID
 * GET /api/alerts/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id)
        .populate('assignedTeam')
        .populate('touristId');

    if (!alert) {
        throw new ApiError(404, 'Alert not found', 'NOT_FOUND');
    }

    res.json(successResponse(alert));
});

/**
 * Create New Alert
 * POST /api/alerts
 */
exports.create = asyncHandler(async (req, res) => {
    const { type, severity, location, coordinates, tourist, touristId, phone, description, priority } = req.body;

    const alert = new Alert({
        type,
        severity: severity || 'medium',
        location,
        coordinates,
        tourist,
        touristId,
        phone,
        description,
        priority: priority || 3,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });

    await alert.save();
    logger.info(`Alert created: ${type} at ${location}`);

    res.status(201).json(successResponse(alert, 'Alert created successfully'));
});

/**
 * Update Alert Status
 * PATCH /api/alerts/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'responding', 'investigating', 'resolved'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Valid values: ${validStatuses.join(', ')}`, 'INVALID_STATUS');
    }

    const alert = await Alert.findById(id);
    if (!alert) {
        throw new ApiError(404, 'Alert not found', 'NOT_FOUND');
    }

    alert.status = status;
    if (status === 'resolved') {
        alert.resolvedAt = new Date();
    }

    await alert.save();
    logger.info(`Alert ${id} status updated to ${status}`);

    res.json(successResponse(alert, 'Status updated'));
});

/**
 * Assign Team to Alert
 * PATCH /api/alerts/:id/assign
 */
exports.assignTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teamId } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
        throw new ApiError(404, 'Alert not found', 'NOT_FOUND');
    }

    const team = await ResponseTeam.findById(teamId);
    if (!team) {
        throw new ApiError(404, 'Team not found', 'NOT_FOUND');
    }

    alert.assignedTeam = teamId;
    alert.status = 'responding';
    await alert.save();

    // Update team status
    team.status = 'responding';
    team.currentAssignment = id;
    await team.save();

    logger.info(`Alert ${id} assigned to team ${team.name}`);

    const updatedAlert = await Alert.findById(id).populate('assignedTeam');
    res.json(successResponse(updatedAlert, `Assigned to ${team.name}`));
});

module.exports = exports;
