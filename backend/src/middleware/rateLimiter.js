/**
 * Rate Limiting Middleware
 * Prevents abuse and ensures fair usage
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for dev
    message: {
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
});

// Gateway rate limiter (higher limit for IoT devices)
const gatewayLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute (1 per second average)
    message: {
        success: false,
        error: 'Gateway rate limit exceeded',
        code: 'GATEWAY_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
});

// SOS endpoint limiter (prevent false alarms)
const sosLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Max 10 SOS per device per 5 minutes
    message: {
        success: false,
        error: 'SOS rate limit exceeded',
        code: 'SOS_RATE_LIMIT'
    },
    validate: { xForwardedForHeader: false }
});

// Strict limiter for authentication attempts
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'development' ? 100 : 5, // Higher limit for dev
    message: {
        success: false,
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT'
    },
    validate: { xForwardedForHeader: false }
});

module.exports = {
    generalLimiter,
    gatewayLimiter,
    sosLimiter,
    authLimiter
};
