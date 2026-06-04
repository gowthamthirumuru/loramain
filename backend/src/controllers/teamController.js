/**
 * Response Team Controller
 * Management of response teams
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

/**
 * Get All Teams
 * GET /api/teams
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const teams = await prisma.responseTeam.findMany({
        where: filter,
        orderBy: { name: 'asc' }
    });

    // Return flat array for frontend compatibility
    res.json(successResponse(teams));
});

/**
 * Get Available Teams
 * GET /api/teams/available
 */
exports.getAvailable = asyncHandler(async (req, res) => {
    const teams = await prisma.responseTeam.findMany({
        where: { status: 'available' }
    });
    res.json(successResponse(teams));
});

/**
 * Get Team by ID
 * GET /api/teams/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const team = await prisma.responseTeam.findUnique({
        where: { id: req.params.id }
    });

    if (!team) {
        throw new ApiError(404, 'Team not found');
    }

    res.json(successResponse(team));
});

/**
 * Create Team
 * POST /api/teams
 */
exports.create = asyncHandler(async (req, res) => {
    const { name, type, members, contact, leader } = req.body;

    const team = await prisma.responseTeam.create({
        data: {
            name,
            type,
            members: members || 4,
            contact,
            leader,
            status: 'available',
            location: 'Base Station'
        }
    });

    res.status(201).json(successResponse(team, 'Team created'));
});

/**
 * Update Team Status
 * PATCH /api/teams/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { status, location, currentAssignment } = req.body;

    const team = await prisma.responseTeam.update({
        where: { id: req.params.id },
        data: {
            status,
            location,
            currentAssignment,
            updatedAt: new Date()
        }
    });

    res.json(successResponse(team, 'Team status updated'));
});

/**
 * Deploy Team
 * POST /api/teams/:id/deploy
 */
exports.deploy = asyncHandler(async (req, res) => {
    const { assignmentId, eta } = req.body;

    const team = await prisma.responseTeam.update({
        where: { id: req.params.id },
        data: {
            status: 'responding',
            currentAssignment: assignmentId,
            eta: eta || '15 min'
        }
    });

    res.json(successResponse(team, `${team.name} deployed`));
});

/**
 * Delete Team
 * DELETE /api/teams/:id
 */
exports.delete = asyncHandler(async (req, res) => {
    await prisma.responseTeam.delete({
        where: { id: req.params.id }
    });

    res.json(successResponse(null, 'Team deleted'));
});
