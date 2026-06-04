/**
 * Cron Service
 * Background jobs for system maintenance
 */

const cron = require('node-cron');
const { prisma } = require('../config/db');
const logger = require('../utils/logger');
const socketService = require('../utils/socketService');
const { TOURIST_STATUS, LIMITS, SOCKET_EVENTS } = require('../config/constants');

/**
 * Check for offline tourists
 * Runs every minute
 */
const checkOfflineTourists = async () => {
    try {
        const thresholdDate = new Date(Date.now() - LIMITS.OFFLINE_THRESHOLD_MS);

        // Find tourists who are ACTIVE but haven't been seen since threshold
        const offlineTourists = await prisma.tourist.findMany({
            where: {
                status: TOURIST_STATUS.ACTIVE,
                last_seen: {
                    lt: thresholdDate
                }
            }
        });

        if (offlineTourists.length > 0) {
            logger.info(`[Cron] Found ${offlineTourists.length} offline tourists`);

            for (const tourist of offlineTourists) {
                // Update status to OFFLINE
                await prisma.tourist.update({
                    where: { id: tourist.id },
                    data: { status: TOURIST_STATUS.OFFLINE }
                });

                // Notify via Socket
                try {
                    const io = socketService.getIO();
                    io.emit(SOCKET_EVENTS.TOURIST_OFFLINE, {
                        tourist_id: tourist.id,
                        name: tourist.name,
                        last_seen: tourist.last_seen,
                        timestamp: new Date().toISOString()
                    });

                    logger.info(`[Cron] Marked tourist ${tourist.id} as OFFLINE`);
                } catch (socketErr) {
                    logger.warn(`[Cron] Failed to emit offline event for ${tourist.id}: ${socketErr.message}`);
                }
            }
        }
    } catch (error) {
        logger.error(`[Cron] Error checking offline tourists: ${error.message}`);
    }
};

/**
 * Cleanup old location logs
 * Runs daily at midnight
 */
const cleanupOldData = async () => {
    try {
        const retentionDays = LIMITS.RETENTION_DAYS || 30;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const deleted = await prisma.locationLog.deleteMany({
            where: {
                timestamp: {
                    lt: thresholdDate
                }
            }
        });




        if (deleted.count > 0) {
            logger.info(`[Cron] Cleaned up ${deleted.count} old location logs older than ${retentionDays} days`);
        }
    } catch (error) {
        logger.error(`[Cron] Error cleaning up old data: ${error.message}`);
    }
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    // Run every minute for offline detection
    cron.schedule('* * * * *', checkOfflineTourists);

    // Run every day at midnight for data cleanup
    cron.schedule('0 0 * * *', cleanupOldData);

    logger.info('Cron jobs initialized');
};

module.exports = {
    initCronJobs,
    checkOfflineTourists,
    cleanupOldData
};
