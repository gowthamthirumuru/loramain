/**
 * Emergency Model
 * High-priority emergency incidents requiring immediate response
 */

const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema({
    // Emergency type
    type: {
        type: String,
        required: true,
        trim: true
    },

    // Severity level
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'high'
    },

    // Current status
    status: {
        type: String,
        enum: ['dispatched', 'in_progress', 'searching', 'resolved'],
        default: 'dispatched'
    },

    // Location description
    location: {
        type: String,
        required: true
    },

    // GPS coordinates as string
    coordinates: String,

    // Tourist name
    tourist: {
        type: String,
        required: true
    },

    // Reference to tourist document
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist'
    },

    // Time elapsed display string
    timeElapsed: String,

    // Assigned response team name
    assignedTeam: {
        type: String,
        default: 'Unassigned'
    },

    // Reference to team document
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTeam'
    },

    // Response time in minutes
    responseTime: Number,

    // Resolution details
    resolvedAt: Date,
    notes: String

}, { timestamps: true });

// Indexes
EmergencySchema.index({ status: 1 });
EmergencySchema.index({ severity: 1 });
EmergencySchema.index({ createdAt: -1 });

// Pre-save hook to calculate response time
EmergencySchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
        this.resolvedAt = new Date();
        const diffMs = this.resolvedAt - this.createdAt;
        this.responseTime = Math.round(diffMs / 60000); // minutes
    }
    next();
});

// Update time elapsed virtual
EmergencySchema.virtual('calculatedTimeElapsed').get(function () {
    const diff = Date.now() - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
});

EmergencySchema.set('toJSON', { virtuals: true });
EmergencySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Emergency', EmergencySchema);
