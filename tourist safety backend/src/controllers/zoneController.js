/**
 * Zone Controller
 * CRUD operations for geographic zones/geofences
 */

const Zone = require('../models/Zone');
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

    const zones = await Zone.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

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
    const zone = await Zone.findById(req.params.id)
        .populate('createdBy', 'name email');

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

    const zone = await Zone.create({
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
        alertSettings,
        createdBy: req.user?._id
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

    const zone = await Zone.findByIdAndUpdate(
        req.params.id,
        { name, type, description, boundary, center, radius, status, color, alertSettings },
        { new: true, runValidators: true }
    );

    if (!zone) {
        throw new ApiError(404, 'Zone not found');
    }

    res.json(successResponse(zone, 'Zone updated'));
});

/**
 * @swagger
 * /api/zones/{id}:
 *   delete:
 *     summary: Delete zone
 *     tags: [Zones]
 */
exports.delete = asyncHandler(async (req, res) => {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    if (!zone) {
        throw new ApiError(404, 'Zone not found');
    }

    res.json(successResponse(null, 'Zone deleted'));
});

/**
 * @swagger
 * /api/zones/{id}/status:
 *   patch:
 *     summary: Toggle zone status
 *     tags: [Zones]
 */
exports.toggleStatus = asyncHandler(async (req, res) => {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
        throw new ApiError(404, 'Zone not found');
    }

    zone.status = zone.status === 'active' ? 'inactive' : 'active';
    await zone.save();

    res.json(successResponse(zone, `Zone ${zone.status}`));
});
