/**
 * Team Controller
 * Handles response team operations
 */

const ResponseTeam = require('../models/ResponseTeam');
const Emergency = require('../models/Emergency');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get All Teams
 * GET /api/teams
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const teams = await ResponseTeam.find(filter)
        .populate('currentAssignment')
        .sort({ status: 1, name: 1 });

    res.json(successResponse({
        count: teams.length,
        teams
    }));
});

/**
 * Get Team by ID
 * GET /api/teams/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const team = await ResponseTeam.findById(req.params.id)
        .populate('currentAssignment');

    if (!team) {
        throw new ApiError(404, 'Team not found', 'NOT_FOUND');
    }

    res.json(successResponse(team));
});

/**
 * Create New Team
 * POST /api/teams
 */
exports.create = asyncHandler(async (req, res) => {
    const { name, type, location, members, contact, leader } = req.body;

    const team = new ResponseTeam({
        name,
        type,
        location: location || 'Base Station',
        members: members || 4,
        contact,
        leader
    });

    await team.save();
    logger.info(`Team created: ${name}`);

    res.status(201).json(successResponse(team, 'Team created'));
});

/**
 * Update Team Status
 * PATCH /api/teams/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'responding', 'patrol', 'offline'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Valid values: ${validStatuses.join(', ')}`, 'INVALID_STATUS');
    }

    const team = await ResponseTeam.findById(id);
    if (!team) {
        throw new ApiError(404, 'Team not found', 'NOT_FOUND');
    }

    team.status = status;
    if (status === 'available') {
        team.currentAssignment = null;
        team.eta = null;
    }

    await team.save();
    logger.info(`Team ${team.name} status updated to ${status}`);

    res.json(successResponse(team, 'Status updated'));
});

/**
 * Deploy Team
 * POST /api/teams/:id/deploy
 */
exports.deploy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignmentId, eta } = req.body;

    const team = await ResponseTeam.findById(id);
    if (!team) {
        throw new ApiError(404, 'Team not found', 'NOT_FOUND');
    }

    if (team.status === 'responding') {
        throw new ApiError(400, 'Team is already deployed', 'ALREADY_DEPLOYED');
    }

    // Update team
    team.status = 'responding';
    team.currentAssignment = assignmentId;
    team.eta = eta || '15 min';
    await team.save();

    // Update emergency with assigned team
    if (assignmentId) {
        await Emergency.findByIdAndUpdate(assignmentId, {
            assignedTeam: team.name,
            teamId: team._id,
            status: 'dispatched'
        });
    }

    logger.info(`Team ${team.name} deployed to assignment ${assignmentId}`);

    res.json(successResponse(team, `${team.name} deployed`));
});

/**
 * Get Available Teams
 * GET /api/teams/available
 */
exports.getAvailable = asyncHandler(async (req, res) => {
    const teams = await ResponseTeam.find({ status: 'available' });

    res.json(successResponse({
        count: teams.length,
        teams
    }));
});

module.exports = exports;
