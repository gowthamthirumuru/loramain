/**
 * Alert Controller
 * Handles CRUD operations for alerts
 */

const { prisma } = require('../config/db'); // Use Prisma
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
    // severity is not in current SOSAlert schema, need to verify if we need to add it or if this controller is for a different Alert model.
    // Assuming for now we map to SOSAlert and ignore severity if not present, OR we need to update schema.
    // Given the Mongoose model had it, we should arguably update Schema, but for now let's map what we have.

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Prisma doesn't support 'populate' style like Mongoose in the same way, we use 'include'
    const alerts = await prisma.sOSAlert.findMany({
        where: filter,
        include: {
            tourist: {
                select: { name: true, phone: true }
            }
            // assignedTeam relation missing in SOSAlert schema currently
        },
        orderBy: { created_at: 'desc' }, // Adjusted to match schema field
        skip: skip,
        take: parseInt(limit)
    });

    const total = await prisma.sOSAlert.count({ where: filter });

    // Return flat array for frontend compatibility
    // Include pagination in response headers if needed
    res.set('X-Total-Count', total.toString());
    res.set('X-Page', page.toString());
    res.set('X-Limit', limit.toString());

    res.json(successResponse(alerts));
});

/**
 * Get Alert by ID
 * GET /api/alerts/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const alert = await prisma.sOSAlert.findUnique({
        where: { id: req.params.id },
        include: {
            tourist: true
        }
    });

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

    // Mapping to SOSAlert schema
    const alert = await prisma.sOSAlert.create({
        data: {
            tourist_id: touristId,
            device_id: 'MANUAL', // Placeholder if manual alert
            location: location || coordinates, // Schema expects Json
            status: 'active',
            notes: description
            // missing type, severity, priority in current schema -> suggest adding to schema later
        }
    });

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

    try {
        const data = { status };
        if (status === 'resolved') {
            data.resolved_at = new Date();
        }

        const alert = await prisma.sOSAlert.update({
            where: { id },
            data
        });

        logger.info(`Alert ${id} status updated to ${status}`);
        res.json(successResponse(alert, 'Status updated'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'Alert not found', 'NOT_FOUND');
        }
        throw error;
    }
});

/**
 * Assign Team to Alert
 * PATCH /api/alerts/:id/assign
 */
exports.assignTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teamId } = req.body;

    const team = await prisma.responseTeam.findUnique({
        where: { id: teamId }
    });

    if (!team) {
        throw new ApiError(404, 'Team not found', 'NOT_FOUND');
    }

    // Update Alert with assigned team
    const alert = await prisma.sOSAlert.update({
        where: { id },
        data: {
            status: 'responding',
            assignedTeamId: teamId
        },
        include: { assignedTeam: true }
    });

    // Update team status
    await prisma.responseTeam.update({
        where: { id: teamId },
        data: {
            status: 'responding',
            currentAssignment: id
        }
    });

    logger.info(`Alert ${id} assigned to team ${team.name}`);

    res.json(successResponse(alert, `Assigned to ${team.name}`));
});

module.exports = exports;
