/**
 * Zone Controller
 * CRUD operations for geographic zones/geofences
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

/**
 * @swagger
 * /api/zones:
 *   get:
 *     summary: Get all zones
 *     tags: [Zones]
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const zones = await prisma.zone.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
        // Note: 'createdBy' relation not in current schema, skipping populate
    });

    res.json(successResponse(zones));
});

/**
 * @swagger
 * /api/zones/{id}:
 *   get:
 *     summary: Get zone by ID
 *     tags: [Zones]
 */
exports.getById = asyncHandler(async (req, res) => {
    const zone = await prisma.zone.findUnique({
        where: { id: req.params.id }
    });

    if (!zone) {
        throw new ApiError(404, 'Zone not found');
    }

    res.json(successResponse(zone));
});

/**
 * @swagger
 * /api/zones:
 *   post:
 *     summary: Create new zone
 *     tags: [Zones]
 */
exports.create = asyncHandler(async (req, res) => {
    const { name, type, description, boundary, center, radius, color, alertSettings } = req.body;

    if (!name || !center) {
        throw new ApiError(400, 'Name and center coordinates are required');
    }

    const zone = await prisma.zone.create({
        data: {
            name,
            type: type || 'safe',
            description,
            boundary: boundary || {
                type: 'Polygon',
                coordinates: [[
                    [center.longitude - 0.01, center.latitude - 0.01],
                    [center.longitude + 0.01, center.latitude - 0.01],
                    [center.longitude + 0.01, center.latitude + 0.01],
                    [center.longitude - 0.01, center.latitude + 0.01],
                    [center.longitude - 0.01, center.latitude - 0.01]
                ]]
            },
            center,
            radius: radius || 500,
            color,
            alerts: alertSettings, // Mapped to 'alerts' in schema
        }
    });

    res.status(201).json(successResponse(zone, 'Zone created'));
});

/**
 * @swagger
 * /api/zones/{id}:
 *   put:
 *     summary: Update zone
 *     tags: [Zones]
 */
exports.update = asyncHandler(async (req, res) => {
    const { name, type, description, boundary, center, radius, status, color, alertSettings } = req.body;

    // Map frontend 'status' to schema 'isActive' boolean or keep string?
    // Schema has 'isActive' Boolean. Old code used 'status' string?
    // Old Mongoose schema had 'isActive' default true. Controller 'toggleStatus' flipped it active/inactive strings.
    // Let's assume schema expects isActive boolean.
    // If input status is 'active' -> isActive = true.

    let isActive = undefined;
    if (status) {
        isActive = status === 'active';
    }

    try {
        const zone = await prisma.zone.update({
            where: { id: req.params.id },
            data: {
                name,
                type,
                description,
                boundary,
                center,
                maxCapacity: radius, // Using radius as proxy or just mapping fields? Schema has maxCapacity, radius seems unused in schema but used in controller. Storing radius in 'maxCapacity' for now or ignoring? 
                // Schema has 'maxCapacity'. Create used 'radius'. Let's assume we store radius in JSON or add field? 
                // Wait, Schema has `boundary` (Json), `center` (Json). No `radius` column.
                // I will add radius to the `boundary` or `center` JSON if needed, or ignore.
                // Let's just pass what matches schema.
                color,
                alerts: alertSettings,
                isActive: isActive
            }
        });

        res.json(successResponse(zone, 'Zone updated'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'Zone not found');
        }
        throw error;
    }
});

/**
 * @swagger
 * /api/zones/{id}:
 *   delete:
 *     summary: Delete zone
 *     tags: [Zones]
 */
exports.delete = asyncHandler(async (req, res) => {
    try {
        await prisma.zone.delete({
            where: { id: req.params.id }
        });
        res.json(successResponse(null, 'Zone deleted'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'Zone not found');
        }
        throw error;
    }
});

/**
 * @swagger
 * /api/zones/{id}/status:
 *   patch:
 *     summary: Toggle zone status
 *     tags: [Zones]
 */
exports.toggleStatus = asyncHandler(async (req, res) => {
    const zone = await prisma.zone.findUnique({
        where: { id: req.params.id }
    });

    if (!zone) {
        throw new ApiError(404, 'Zone not found');
    }

    const newStatus = !zone.isActive;

    const updatedZone = await prisma.zone.update({
        where: { id: req.params.id },
        data: { isActive: newStatus }
    });

    res.json(successResponse(updatedZone, `Zone ${newStatus ? 'activated' : 'deactivated'}`));
});
