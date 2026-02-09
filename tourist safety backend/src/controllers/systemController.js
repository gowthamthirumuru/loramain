
/**
 * System Controller
 * Handles global system configuration and settings
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get System Settings
 * GET /api/system/settings
 * Helper to fetch all or specific settings
 */
exports.getSettings = asyncHandler(async (req, res) => {
    const { key } = req.query;

    let settings;
    if (key) {
        settings = await prisma.systemSettings.findUnique({
            where: { key }
        });

        if (!settings) {
            throw new ApiError(404, `Setting '${key}' not found`, 'SETTING_NOT_FOUND');
        }
    } else {
        settings = await prisma.systemSettings.findMany();
    }

    // Convert array to object for easier consumption { key: value }
    const formattedSettings = Array.isArray(settings)
        ? settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
        : { [settings.key]: settings.value };

    res.json(successResponse(formattedSettings));
});

/**
 * Update System Settings
 * PUT /api/system/settings
 * Body: { "gps_reference": { "lat": 11.0, "lng": 76.0 } }
 * Requires Admin Role (middleware handled in route)
 */
exports.updateSettings = asyncHandler(async (req, res) => {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No settings provided updates', 'INVALID_INPUT');
    }

    const updatedSettings = {};

    // Process updates transactionally if needed, or loop
    // Using loop for simplicity as keys are unique
    for (const [key, value] of Object.entries(updates)) {
        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        updatedSettings[key] = setting.value;

        logger.info(`[System] Setting updated: ${key} by ${req.user ? req.user.email : 'Unknown'}`);
    }

    res.json(successResponse(updatedSettings, 'Settings updated successfully'));
});
