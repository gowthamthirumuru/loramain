
/**
 * Health Controller
 * System status checks
 */
const { prisma } = require('../config/db');
const { successResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get Basic Health Status
 * GET /api/health
 */
exports.getHealth = (req, res) => {
    res.json(successResponse({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date()
    }, 'System is operational'));
};

/**
 * Get Detailed System Status (DB, Memory)
 * GET /api/health/detailed
 */
exports.getDetailedHealth = asyncHandler(async (req, res) => {
    const start = Date.now();
    let dbStatus = 'disconnected';
    let dbLatency = 0;

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
        dbLatency = Date.now() - start;
    } catch (e) {
        dbStatus = 'error';
    }

    const memoryUsage = process.memoryUsage();

    res.json(successResponse({
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date(),
        database: {
            status: dbStatus,
            latency_ms: dbLatency
        },
        system: {
            memory_rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
            memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        }
    }, 'Detailed system status'));
});
