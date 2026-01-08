/**
 * Audit Log Model
 * Tracks all important actions in the system
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    // Action type
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE', 'UPDATE', 'DELETE',
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
            'SOS_TRIGGERED', 'SOS_RESOLVED',
            'TEAM_DEPLOYED', 'TEAM_RELEASED',
            'ALERT_CREATED', 'ALERT_RESOLVED',
            'REPORT_GENERATED', 'SETTINGS_CHANGED'
        ]
    },

    // Entity type affected
    entityType: {
        type: String,
        required: true,
        enum: ['Tourist', 'SOSAlert', 'Alert', 'Emergency', 'ResponseTeam', 'User', 'Report', 'Settings', 'Anchor']
    },

    // Entity ID
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },

    // Who performed the action
    performedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        ip: String
    },

    // Description of the action
    description: {
        type: String,
        required: true
    },

    // Previous data (for updates)
    previousData: {
        type: mongoose.Schema.Types.Mixed
    },

    // New data (for creates/updates)
    newData: {
        type: mongoose.Schema.Types.Mixed
    },

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }

}, { timestamps: true });

// Indexes for efficient querying
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1 });
AuditLogSchema.index({ 'performedBy.userId': 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

// Static method to create log entry
AuditLogSchema.statics.log = async function (data) {
    const log = new this(data);
    return log.save();
};

// Static method to get recent activity
AuditLogSchema.statics.getRecent = function (limit = 50) {
    return this.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('performedBy.userId', 'name username');
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
