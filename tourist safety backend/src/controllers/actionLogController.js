const { prisma } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Log an administrative action
 * @param {string} userId - User performing the action
 * @param {string} action - Action identifier (e.g., 'CREATE_USER')
 * @param {string} details - Additional details
 * @param {Object} req - Express request object (optional, for IP/UserAgent)
 */
const logAction = async (userId, action, details, req = null) => {
    try {
        await prisma.actionLog.create({
            data: {
                action,
                details,
                userId,
                ipAddress: req?.ip || req?.connection?.remoteAddress,
                userAgent: req?.get('User-Agent')
            }
        });
    } catch (error) {
        console.error('Failed to log action:', error);
        // We don't throw here to avoid failing the main request
    }
};

/**
 * Get Action Logs (Admin only)
 * GET /api/admin/logs
 */
const getLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.actionLog.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { username: true, email: true }
                }
            }
        }),
        prisma.actionLog.count()
    ]);

    res.json({
        success: true,
        data: logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

module.exports = {
    logAction,
    getLogs
};
