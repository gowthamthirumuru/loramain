/**
 * Database Cleanup Script
 * Removes old data to prevent database bloat
 * 
 * Usage: node scripts/cleanup.js
 * 
 * Can be run as a cron job:
 * 0 2 * * * cd /path/to/backend && node scripts/cleanup.js >> logs/cleanup.log 2>&1
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const LocationLog = require('../src/models/LocationLog');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const SOSAlert = require('../src/models/SOSAlert');
const Tourist = require('../src/models/Tourist');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety';

// Retention periods (in days)
const RETENTION = {
    locationLogs: 30,      // Keep location history for 30 days
    auditLogs: 90,         // Keep audit logs for 90 days
    notifications: 30,     // Keep notifications for 30 days
    resolvedSOS: 365,      // Keep resolved SOS alerts for 1 year
    finishedTourists: 180  // Keep finished tourist records for 6 months
};

async function cleanup() {
    const startTime = Date.now();
    console.log('🧹 Starting database cleanup...');
    console.log(`   Time: ${new Date().toISOString()}\n`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const results = {
            locationLogs: 0,
            auditLogs: 0,
            notifications: 0,
            sosAlerts: 0,
            tourists: 0
        };

        // ============ LOCATION LOGS ============
        console.log('📍 Cleaning up old location logs...');
        const locationCutoff = new Date();
        locationCutoff.setDate(locationCutoff.getDate() - RETENTION.locationLogs);

        const locationResult = await LocationLog.deleteMany({
            timestamp: { $lt: locationCutoff }
        });
        results.locationLogs = locationResult.deletedCount;
        console.log(`   ✓ Removed ${results.locationLogs} location logs older than ${RETENTION.locationLogs} days`);

        // ============ AUDIT LOGS ============
        console.log('\n📋 Cleaning up old audit logs...');
        const auditCutoff = new Date();
        auditCutoff.setDate(auditCutoff.getDate() - RETENTION.auditLogs);

        const auditResult = await AuditLog.deleteMany({
            createdAt: { $lt: auditCutoff }
        });
        results.auditLogs = auditResult.deletedCount;
        console.log(`   ✓ Removed ${results.auditLogs} audit logs older than ${RETENTION.auditLogs} days`);

        // ============ NOTIFICATIONS ============
        console.log('\n🔔 Cleaning up old notifications...');
        const notifCutoff = new Date();
        notifCutoff.setDate(notifCutoff.getDate() - RETENTION.notifications);

        const notifResult = await Notification.deleteMany({
            createdAt: { $lt: notifCutoff },
            read: true  // Only delete read notifications
        });
        results.notifications = notifResult.deletedCount;
        console.log(`   ✓ Removed ${results.notifications} read notifications older than ${RETENTION.notifications} days`);

        // ============ RESOLVED SOS ALERTS ============
        console.log('\n🚨 Cleaning up old resolved SOS alerts...');
        const sosCutoff = new Date();
        sosCutoff.setDate(sosCutoff.getDate() - RETENTION.resolvedSOS);

        const sosResult = await SOSAlert.deleteMany({
            status: { $in: ['resolved', 'false_alarm'] },
            resolved_at: { $lt: sosCutoff }
        });
        results.sosAlerts = sosResult.deletedCount;
        console.log(`   ✓ Removed ${results.sosAlerts} resolved SOS alerts older than ${RETENTION.resolvedSOS} days`);

        // ============ FINISHED TOURISTS ============
        console.log('\n👤 Cleaning up old finished tourist records...');
        const touristCutoff = new Date();
        touristCutoff.setDate(touristCutoff.getDate() - RETENTION.finishedTourists);

        // Permanently delete soft-deleted tourists
        const touristResult = await Tourist.deleteMany({
            $or: [
                { status: 'finished', trip_end: { $lt: touristCutoff } },
                { isDeleted: true, deletedAt: { $lt: touristCutoff } }
            ]
        });
        results.tourists = touristResult.deletedCount;
        console.log(`   ✓ Removed ${results.tourists} finished/deleted tourist records older than ${RETENTION.finishedTourists} days`);

        // ============ SUMMARY ============
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const totalRemoved = Object.values(results).reduce((a, b) => a + b, 0);

        console.log('\n' + '='.repeat(50));
        console.log('📊 Cleanup Summary');
        console.log('='.repeat(50));
        console.log(`   Location Logs:  ${results.locationLogs}`);
        console.log(`   Audit Logs:     ${results.auditLogs}`);
        console.log(`   Notifications:  ${results.notifications}`);
        console.log(`   SOS Alerts:     ${results.sosAlerts}`);
        console.log(`   Tourists:       ${results.tourists}`);
        console.log('='.repeat(50));
        console.log(`   Total Removed:  ${totalRemoved}`);
        console.log(`   Time Elapsed:   ${elapsed}s`);
        console.log('='.repeat(50));

        // Log current database stats
        console.log('\n📈 Current Collection Sizes:');
        console.log(`   LocationLog:   ${await LocationLog.countDocuments()}`);
        console.log(`   AuditLog:      ${await AuditLog.countDocuments()}`);
        console.log(`   Notification:  ${await Notification.countDocuments()}`);
        console.log(`   SOSAlert:      ${await SOSAlert.countDocuments()}`);
        console.log(`   Tourist:       ${await Tourist.countDocuments()}`);

        console.log('\n✅ Cleanup completed successfully!');

    } catch (error) {
        console.error('\n❌ Cleanup error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run cleanup
cleanup();
