/**
 * Device Controller
 * Handles device management (Tourists, Anchors, Relays, Gateways)
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Create a new Device
 * POST /api/devices
 */
exports.create = asyncHandler(async (req, res) => {
    const { deviceId, name, type, firmwareVersion, status } = req.body;

    // Check if device ID already exists
    const existing = await prisma.device.findUnique({
        where: { deviceId }
    });

    if (existing) {
        throw new ApiError(409, 'Device ID already exists', 'DUPLICATE_DEVICE');
    }

    const device = await prisma.device.create({
        data: {
            deviceId,
            name,
            type,
            firmwareVersion,
            status: status || 'offline',
            lastSeen: new Date()
        }
    });

    logger.info(`Device created: ${deviceId} (${type})`);
    res.status(201).json(successResponse(device, 'Device created successfully'));
});

/**
 * Get All Devices
 * GET /api/devices
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { type, status, unassigned } = req.query;

    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

    // Handle unassigned logic (complex because assignment logic is split between Tourist and Device tables)
    // Ideally, if unassigned=true, we should check if NOT linked to active Tourist.
    // But current implementation relies on Tourist table having device_id.

    // For now, return all matching type/status.
    // The frontend filters unassigned logic based on API response? No, query param.

    // If unassigned=true is passed (used by TouristRegistration), we should filter devices that are NOT in active use.
    if (unassigned === 'true') {
        // Get all active tourist device_ids
        const activeTourists = await prisma.tourist.findMany({
            where: {
                status: { in: ['registered', 'active', 'suboptimal', 'SOS'] }
            },
            select: { device_id: true }
        });
        const inUseDeviceIds = activeTourists.map(t => t.device_id);

        filter.deviceId = { notIn: inUseDeviceIds };
    }

    const devices = await prisma.device.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
        include: {
            assignedTo: true // Include assigned user if any (though currently unused/rare)
        }
    });

    // Manual enrichment for "Assigned To" logic based on Tourist table
    // This is expensive but necessary without direct relation in schema.
    // We can optimize later.

    // Fetch all active tourists to map assignments
    const activeAssignments = await prisma.tourist.findMany({
        where: {
            status: { in: ['registered', 'active', 'suboptimal', 'SOS'] }
        },
        select: { device_id: true, name: true, id: true }
    });

    const assignmentMap = activeAssignments.reduce((acc, curr) => {
        acc[curr.device_id] = { _id: curr.id, name: curr.name };
        return acc;
    }, {});

    const enrichedDevices = devices.map(d => ({
        ...d,
        assignedTo: assignmentMap[d.deviceId] || d.assignedTo || null
    }));

    res.json(successResponse(enrichedDevices));
});

/**
 * Update Device
 * PUT /api/devices/:id
 */
exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, type, status, firmwareVersion, deviceId } = req.body;

    // Check if device exists
    const existing = await prisma.device.findUnique({
        where: { id }
    });

    if (!existing) {
        throw new ApiError(404, 'Device not found', 'NOT_FOUND');
    }

    // Check unique constraint if changing deviceId
    if (deviceId && deviceId !== existing.deviceId) {
        const duplicate = await prisma.device.findUnique({ where: { deviceId } });
        if (duplicate) throw new ApiError(409, 'Device ID already exists', 'DUPLICATE_DEVICE');
    }

    const updatedDevice = await prisma.device.update({
        where: { id },
        data: {
            name,
            type,
            status,
            firmwareVersion,
            deviceId
        }
    });

    logger.info(`Device updated: ${updatedDevice.deviceId}`);
    res.json(successResponse(updatedDevice, 'Device updated successfully'));
});

/**
 * Delete Device
 * DELETE /api/devices/:id
 */
exports.delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.device.findUnique({
        where: { id }
    });

    if (!existing) {
        throw new ApiError(404, 'Device not found', 'NOT_FOUND');
    }

    // Check if assigned to any active tourist
    const activeAssignment = await prisma.tourist.findFirst({
        where: {
            device_id: existing.deviceId,
            status: { in: ['registered', 'active', 'suboptimal', 'SOS'] }
        }
    });

    if (activeAssignment) {
        throw new ApiError(409, `Device is currently assigned to tourist ${activeAssignment.name}`, 'DEVICE_IN_USE');
    }

    await prisma.device.delete({
        where: { id }
    });

    logger.info(`Device deleted: ${existing.deviceId}`);
    res.json(successResponse(null, 'Device deleted successfully'));
});
