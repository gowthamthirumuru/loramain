const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

exports.getAll = asyncHandler(async (req, res) => {
    const alerts = await prisma.sOSAlert.findMany({
        where: { status: { not: 'resolved' } },
        include: { tourist: true, assignedTeam: true },
        orderBy: { created_at: 'desc' }
    });

    // Map to Emergency interface expected by frontend
    // Frontend EmergencyStatus: 'dispatched' | 'in_progress' | 'searching' | 'resolved'
    // Backend SOSAlert status: 'active' | 'responding' | 'investigating' | 'resolved'
    const statusMap = {
        'active': 'dispatched',
        'responding': 'in_progress',
        'investigating': 'searching',
        'resolved': 'resolved'
    };

    const emergencies = alerts.map(alert => ({
        id: alert.id,
        type: alert.type || 'SOS',
        severity: alert.severity || 'critical',
        location: typeof alert.location === 'string' ? alert.location : 'Unknown',
        coordinates: JSON.stringify(alert.location),
        tourist: alert.tourist ? alert.tourist.name : 'Unknown',
        touristId: alert.tourist_id,
        status: statusMap[alert.status] || 'dispatched',
        timeElapsed: calculateTimeElapsed(alert.created_at),
        createdAt: alert.created_at,
        assignedTeam: alert.assignedTeam ? alert.assignedTeam.name : 'Unassigned',
        notes: alert.notes
    }));

    res.json(successResponse(emergencies));
});

exports.getById = asyncHandler(async (req, res) => {
    const alert = await prisma.sOSAlert.findUnique({
        where: { id: req.params.id },
        include: { tourist: true }
    });

    if (!alert) throw new ApiError(404, 'Emergency not found');

    res.json(successResponse(alert));
});

exports.create = asyncHandler(async (req, res) => {
    // Reuse alert creation logic or separate?
    // For now, assume emergencies are created mainly via SOS button which hits /alerts
    // This endpoint might be for manual entry
    const { type, location, touristId, severity } = req.body;

    // Check if tourist exists
    // ...

    // Create
    const emergency = await prisma.sOSAlert.create({
        data: {
            tourist_id: touristId || 'unknown', // simplifying
            device_id: 'MANUAL',
            location: location,
            status: 'active',
            notes: `Manual Emergency: ${type} - ${severity}`
        }
    });

    res.status(201).json(successResponse(emergency));
});

exports.updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const alert = await prisma.sOSAlert.update({
        where: { id: req.params.id },
        data: { status }
    });
    res.json(successResponse(alert));
});

exports.resolve = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const alert = await prisma.sOSAlert.update({
        where: { id: req.params.id },
        data: {
            status: 'resolved',
            resolved_at: new Date(),
            notes: notes ? notes : undefined
        }
    });
    res.json(successResponse(alert));
});

function calculateTimeElapsed(date) {
    const diff = new Date() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours`;
}
