/**
 * Conversation Model
 * Communication threads between command center and field teams/tourists
 */

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    // Participant name (team name, tourist name, or external contact)
    participant: {
        type: String,
        required: true,
        trim: true
    },

    // Communication type
    type: {
        type: String,
        enum: ['radio', 'phone', 'email'],
        default: 'radio'
    },

    // Current status
    status: {
        type: String,
        enum: ['active', 'waiting', 'standby', 'closed'],
        default: 'active'
    },

    // Last message preview
    lastMessage: {
        type: String,
        default: ''
    },

    // Last activity time string
    time: String,

    // Priority level
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },

    // Unread message count
    unread: {
        type: Number,
        default: 0
    },

    // Related entities
    relatedTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTeam'
    },

    relatedTouristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist'
    },

    relatedEmergencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Emergency'
    },

    // Last activity timestamp
    lastActivityAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

// Indexes
ConversationSchema.index({ status: 1 });
ConversationSchema.index({ priority: 1 });
ConversationSchema.index({ lastActivityAt: -1 });

// Update time string on save
ConversationSchema.pre('save', function (next) {
    this.time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    this.lastActivityAt = new Date();
    next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
