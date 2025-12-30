/**
 * Application Constants
 * Centralized configuration values
 */

// Tourist status values
const TOURIST_STATUS = {
    ACTIVE: 'active',
    SOS: 'sos',
    OFFLINE: 'offline',
    FINISHED: 'finished'
};

// SOS Alert status values
const SOS_STATUS = {
    ACTIVE: 'active',
    RESOLVED: 'resolved',
    FALSE_ALARM: 'false_alarm'
};

// Anchor/Gateway status values
const ANCHOR_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    MAINTENANCE: 'maintenance'
};

// Timeouts and limits
const LIMITS = {
    OFFLINE_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes without update = offline
    MAX_BATCH_SIZE: 50, // Maximum locations in batch update
    LOCATION_HISTORY_LIMIT: 1000, // Max location records to return
    SOS_COOLDOWN_MS: 30 * 1000 // 30 seconds between SOS triggers per device
};

// Coordinate bounds (example for India region - adjust as needed)
const GEO_BOUNDS = {
    MIN_LAT: 6.0,
    MAX_LAT: 37.0,
    MIN_LNG: 68.0,
    MAX_LNG: 97.5
};

// Socket event names
const SOCKET_EVENTS = {
    LOCATION_UPDATE: 'location_update',
    SOS_ALERT: 'sos_alert',
    SOS_RESOLVED: 'sos_resolved',
    TOURIST_OFFLINE: 'tourist_offline',
    ANCHOR_STATUS: 'anchor_status'
};

module.exports = {
    TOURIST_STATUS,
    SOS_STATUS,
    ANCHOR_STATUS,
    LIMITS,
    GEO_BOUNDS,
    SOCKET_EVENTS
};
