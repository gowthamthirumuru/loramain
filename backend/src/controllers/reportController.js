
/**
 * Report Controller
 * Handles historical data aggregation and analytics
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

/**
 * Get Daily Activity Report
 * GET /api/reports/daily-activity?date=YYYY-MM-DD
 */
exports.getDailyActivity = asyncHandler(async (req, res) => {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // 1. Total Messages / Logs
    const totalLogs = await prisma.locationLog.count({
        where: {
            timestamp: {
                gte: startDate,
                lt: endDate
            }
        }
    });

    // 2. Active Tourists (Unique IDs seen)
    const activeTourists = await prisma.locationLog.groupBy({
        by: ['tourist_id'],
        where: {
            timestamp: {
                gte: startDate,
                lt: endDate
            }
        },
        _count: true
    });

    // 3. Peak Hour Calculation
    // Prisma doesn't support easy date extraction in groupBy for all DBs, 
    // but for Postgres we can use raw query or just fetch timestamps if volume isn't huge.
    // For scalability, let's use a raw query.

    const peakHourData = await prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
        FROM "LocationLog"
        WHERE timestamp >= ${startDate} AND timestamp < ${endDate}
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
    `;

    // 4. Incident Count for the day
    const incidents = await prisma.sOSAlert.count({
        where: {
            created_at: {
                gte: startDate,
                lt: endDate
            }
        }
    });

    const peakHour = peakHourData.length > 0 ? parseInt(peakHourData[0].hour) : null;
    const peakVolume = peakHourData.length > 0 ? Number(peakHourData[0].count) : 0;

    res.json(successResponse({
        date: dateStr,
        metrics: {
            total_logs: totalLogs,
            active_tourists: activeTourists.length,
            total_incidents: incidents,
            peak_hour: peakHour,
            peak_volume: peakVolume
        }
    }));
});

/**
 * Get Incident Summary
 * GET /api/reports/incidents?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
exports.getIncidentSummary = asyncHandler(async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // 1. Total Alerts
    const totalAlerts = await prisma.sOSAlert.count({
        where: {
            created_at: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    // 2. Status Breakdown
    const statusBreakdown = await prisma.sOSAlert.groupBy({
        by: ['status'],
        where: {
            created_at: {
                gte: startDate,
                lte: endDate
            }
        },
        _count: {
            status: true
        }
    });

    // 3. Average Resolution Time (for resolved alerts)
    const resolvedAlerts = await prisma.sOSAlert.findMany({
        where: {
            status: 'resolved',
            created_at: {
                gte: startDate,
                lte: endDate
            },
            resolved_at: { not: null }
        },
        select: {
            created_at: true,
            resolved_at: true
        }
    });

    let totalDurationMs = 0;
    resolvedAlerts.forEach(alert => {
        totalDurationMs += (new Date(alert.resolved_at) - new Date(alert.created_at));
    });

    const avgResolutionTimeMinutes = resolvedAlerts.length > 0
        ? Math.round((totalDurationMs / resolvedAlerts.length) / 60000)
        : 0;

    res.json(successResponse({
        period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        },
        summary: {
            total_alerts: totalAlerts,
            avg_resolution_time_mins: avgResolutionTimeMinutes,
            breakdown: statusBreakdown.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.status }), {})
        }
    }));
});

/**
 * Get Real-Time System Stats
 * GET /api/reports/stats
 */
exports.getSystemStats = asyncHandler(async (req, res) => {
    // 1. Tourist Stats
    const totalTourists = await prisma.tourist.count();
    const activeTourists = await prisma.tourist.count({ where: { status: 'active' } });
    const sosTourists = await prisma.tourist.count({ where: { status: 'sos' } });

    // 2. Master Node Status (Anchor)
    const masterNode = await prisma.anchor.findFirst({
        where: { is_master: true }
    });

    const isMasterOnline = masterNode
        ? (new Date() - new Date(masterNode.last_heartbeat || 0)) < 60000 * 2 // 2 mins threshold
        : false;

    // 3. Database Health (Simple check)
    let dbStatus = 'healthy';
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
        dbStatus = 'degraded';
    }

    res.json(successResponse({
        system_status: dbStatus,
        master_node: {
            online: isMasterOnline,
            last_seen: masterNode ? masterNode.last_heartbeat : null
        },
        tourists: {
            total: totalTourists,
            active: activeTourists,
            sos: sosTourists
        }
    }));
});
