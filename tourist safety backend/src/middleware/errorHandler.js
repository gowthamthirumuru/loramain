/**
 * Central Error Handler Middleware
 * Provides consistent error responses across the API
 */

// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND');
    next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';

    // Log error details (in production, use proper logger)
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error(`  Path: ${req.method} ${req.path}`);
    console.error(`  Message: ${message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(`  Stack: ${err.stack}`);
    }

    // --- Prisma Error Handling ---
    if (err.code) {
        // P2002: Unique constraint failed
        if (err.code === 'P2002') {
            statusCode = 409;
            code = 'DUPLICATE_ENTRY';
            const target = err.meta?.target || 'Field';
            message = `${target} must be unique`;
        }
        // P2025: Record not found
        else if (err.code === 'P2025') {
            statusCode = 404;
            code = 'NOT_FOUND';
            message = 'Requested resource not found';
        }
        // P2003: Foreign key constraint failed
        else if (err.code === 'P2003') {
            statusCode = 400;
            code = 'CONSTRAINT_VIOLATION';
            message = 'Invalid reference to related record';
        }
        // P1000-P1017: Database connection errors
        else if (err.code.startsWith('P10')) {
            statusCode = 503;
            code = 'DATABASE_UNAVAILABLE';
            message = 'Service temporarily unavailable (Database connection)';
            console.error('CRITICAL: Database connection failure:', err.code);
        }
    }

    // --- JWT Errors ---
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token expired';
    }

    // --- Validation Errors (Joi/Zod if used) ---
    if (err.isJoi) {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.details[0].message;
    }

    // --- Safety for Production ---
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An unexpected error occurred';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        code: code,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    notFoundHandler,
    errorHandler,
    asyncHandler
};
