/**
 * Utility Helper Functions
 */

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Check if a point is inside a geofence (circular)
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Object} fence - Geofence {centerLat, centerLng, radiusMeters}
 * @returns {boolean}
 */
const isInsideGeofence = (lat, lng, fence) => {
    const distance = calculateDistance(lat, lng, fence.centerLat, fence.centerLng);
    return distance <= fence.radiusMeters;
};

/**
 * Format timestamp for display
 * @param {Date} date 
 * @returns {string}
 */
const formatTimestamp = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * Generate a unique ID for devices/sessions
 * @param {string} prefix 
 * @returns {string}
 */
const generateId = (prefix = 'ID') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
};

/**
 * Sanitize string input
 * @param {string} input 
 * @returns {string}
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
};

/**
 * Check if timestamp is stale (older than threshold)
 * @param {Date} timestamp 
 * @param {number} thresholdMs - Threshold in milliseconds
 * @returns {boolean}
 */
const isStale = (timestamp, thresholdMs = 5 * 60 * 1000) => {
    const age = Date.now() - new Date(timestamp).getTime();
    return age > thresholdMs;
};

/**
 * Create success response object
 * @param {*} data 
 * @param {string} message 
 * @returns {Object}
 */
const successResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data
    };
};

/**
 * Paginate array
 * @param {Array} array 
 * @param {number} page 
 * @param {number} limit 
 * @returns {Object}
 */
const paginate = (array, page = 1, limit = 20) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
        data: array.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: array.length,
            pages: Math.ceil(array.length / limit)
        }
    };
};

module.exports = {
    calculateDistance,
    isInsideGeofence,
    formatTimestamp,
    generateId,
    sanitizeString,
    isStale,
    successResponse,
    paginate
};
