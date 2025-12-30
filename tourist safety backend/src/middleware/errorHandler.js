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

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    if (err.name === 'CastError') {
        // Invalid MongoDB ObjectId
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
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
