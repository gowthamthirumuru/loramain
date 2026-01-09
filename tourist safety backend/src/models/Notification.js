/**
 * Notification Model
 * System notifications for users
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    // Recipient user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Notification type
    type: {
        type: String,
        enum: ['alert', 'emergency', 'system', 'info', 'warning'],
        required: true
    },

    // Title
    title: {
        type: String,
        required: true,
        trim: true
    },

    // Message content
    message: {
        type: String,
        required: true
    },

    // Severity level
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low', 'info'],
        default: 'info'
    },

    // Read status
    read: {
        type: Boolean,
        default: false
    },

    // Read timestamp
    readAt: {
        type: Date
    },

    // Related entity (optional)
    relatedTo: {
        entityType: { type: String, enum: ['alert', 'emergency', 'tourist', 'team'] },
        entityId: { type: mongoose.Schema.Types.ObjectId }
    },

    // Action URL (optional)
    actionUrl: {
        type: String
    },

    // Expiry
    expiresAt: {
        type: Date
    }

}, { timestamps: true });

// Indexes
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', NotificationSchema);
