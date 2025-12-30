/**
 * Input Validation Middleware
 * Validates request data before processing
 */

const { ApiError } = require('./errorHandler');

// Validate location update from gateway
const validateLocationUpdate = (req, res, next) => {
    const { device_id, lat, lng } = req.body;
    const errors = [];

    // Required fields
    if (!device_id) {
        errors.push('device_id is required');
    }

    if (lat === undefined || lat === null) {
        errors.push('lat (latitude) is required');
    }

    if (lng === undefined || lng === null) {
        errors.push('lng (longitude) is required');
    }

    // Type validation
    if (lat !== undefined && (typeof lat !== 'number' || isNaN(lat))) {
        errors.push('lat must be a valid number');
    }

    if (lng !== undefined && (typeof lng !== 'number' || isNaN(lng))) {
        errors.push('lng must be a valid number');
    }

    // Range validation for coordinates
    if (typeof lat === 'number' && (lat < -90 || lat > 90)) {
        errors.push('lat must be between -90 and 90');
    }

    if (typeof lng === 'number' && (lng < -180 || lng > 180)) {
        errors.push('lng must be between -180 and 180');
    }

    // RSSI validation (optional but if provided, must be valid)
    if (req.body.rssi !== undefined) {
        const rssi = req.body.rssi;
        if (typeof rssi !== 'number' || rssi > 0 || rssi < -150) {
            errors.push('rssi must be a negative number between -150 and 0');
        }
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors.join('; '), 'VALIDATION_ERROR'));
    }

    next();
};

// Validate tourist registration
const validateTouristRegistration = (req, res, next) => {
    const { name, phone, device_id, emergency_contact } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('name must be at least 2 characters');
    }

    if (!phone || !/^\d{10,15}$/.test(phone)) {
        errors.push('phone must be 10-15 digits');
    }

    if (!device_id || typeof device_id !== 'string' || device_id.trim().length < 3) {
        errors.push('device_id must be at least 3 characters');
    }

    if (!emergency_contact || !/^\d{10,15}$/.test(emergency_contact)) {
        errors.push('emergency_contact must be 10-15 digits');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors.join('; '), 'VALIDATION_ERROR'));
    }

    // Sanitize inputs
    req.body.name = name.trim();
    req.body.device_id = device_id.trim().toUpperCase();

    next();
};

// Validate SOS resolution
const validateSOSResolution = (req, res, next) => {
    const { sos_id } = req.body;

    if (!sos_id) {
        return next(new ApiError(400, 'sos_id is required', 'VALIDATION_ERROR'));
    }

    // Check if valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(sos_id)) {
        return next(new ApiError(400, 'Invalid sos_id format', 'VALIDATION_ERROR'));
    }

    next();
};

// Validate MongoDB ObjectId in params
const validateObjectId = (paramName) => (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return next(new ApiError(400, `Invalid ${paramName} format`, 'VALIDATION_ERROR'));
    }

    next();
};

module.exports = {
    validateLocationUpdate,
    validateTouristRegistration,
    validateSOSResolution,
    validateObjectId
};
