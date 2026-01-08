/**
 * Alert Model
 * General alerts for various incident types (not just SOS)
 */

const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    // Alert type (e.g., 'Medical Emergency', 'Lost Tourist', 'Weather Warning')
    type: {
        type: String,
        required: true,
        trim: true
    },

    // Severity level
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
    },

    // Current status
    status: {
        type: String,
        enum: ['active', 'responding', 'investigating', 'resolved'],
        default: 'active'
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

    // Contact phone
    phone: {
        type: String,
        required: true
    },

    // Alert description
    description: {
        type: String,
        default: ''
    },

    // Time string for display
    time: String,

    // Assigned response team
    assignedTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTeam'
    },

    // Priority (1-5, 1 being highest)
    priority: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },

    // Resolution details
    resolvedAt: Date,
    resolvedBy: String,
    resolutionNotes: String

}, { timestamps: true });

// Indexes for efficient queries
AlertSchema.index({ status: 1 });
AlertSchema.index({ severity: 1 });
AlertSchema.index({ priority: 1 });
AlertSchema.index({ createdAt: -1 });

// Virtual for time elapsed
AlertSchema.virtual('timeElapsed').get(function () {
    const diff = Date.now() - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
});

AlertSchema.set('toJSON', { virtuals: true });
AlertSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Alert', AlertSchema);
