/**
 * Dashboard Controller
 * Aggregated data for dashboard widgets
 */

const { prisma } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { TOURIST_STATUS } = require('../config/constants');

/**
 * Get Dashboard Stats
 * GET /api/dashboard/stats
 */
exports.getStats = asyncHandler(async (req, res) => {
    const [
        totalTourists,
        activeTourists,
        sosAlerts,
        resolvedAlerts,
        activeTeams,
        availableTeams,
        totalZones
    ] = await Promise.all([
        prisma.tourist.count(),
        prisma.tourist.count({ where: { status: TOURIST_STATUS.ACTIVE } }),
        prisma.sOSAlert.count({ where: { status: 'active' } }),
        prisma.sOSAlert.count({ where: { status: 'resolved' } }),
        prisma.responseTeam.count({ where: { status: { not: 'offline' } } }),
        prisma.responseTeam.count({ where: { status: 'available' } }),
        prisma.zone.count()
    ]);

    res.json(successResponse({
        tourists: { total: totalTourists, active: activeTourists },
        alerts: { active: sosAlerts, resolved: resolvedAlerts },
        teams: { active: activeTeams, available: availableTeams },
        zones: { total: totalZones }
    }));
});

/**
 * Get Dashboard Metrics (alias for getStats)
 * GET /api/dashboard/metrics
 */
exports.getMetrics = exports.getStats;

/**
 * Get Recent Activity
 * GET /api/dashboard/activity
 */
exports.getActivity = asyncHandler(async (req, res) => {
    const recentAlerts = await prisma.sOSAlert.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { tourist: { select: { name: true, phone: true } } }
    });

    const formattedActivity = recentAlerts.map(alert => ({
        id: alert.id,
        type: 'alert',
        message: `SOS Alert from ${alert.tourist?.name || 'Unknown'}`,
        status: alert.status,
        timestamp: alert.created_at
    }));

    res.json(successResponse(formattedActivity));
});

/**
 * Get Analytics Data
 * GET /api/dashboard/analytics
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
        case '24h': startDate.setDate(startDate.getDate() - 1); break;
        case '30d': startDate.setDate(startDate.getDate() - 30); break;
        default: startDate.setDate(startDate.getDate() - 7);
    }

    // Aggregate incidents by day (simplified stub)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const incidentTrends = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        incidentTrends.push({
            date: days[date.getDay()],
            incidents: Math.floor(Math.random() * 10) + 5,
            resolved: Math.floor(Math.random() * 8) + 3,
            responseTime: (Math.random() * 4 + 6).toFixed(1)
        });
    }

    res.json(successResponse({
        incidentTrends,
        timeRange,
        generatedAt: new Date().toISOString()
    }));
});
