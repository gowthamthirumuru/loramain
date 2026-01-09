/**
 * Shift Model
 * Team shift scheduling
 */

const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    // Team assigned to shift
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTeam',
        required: true
    },

    // Shift name/identifier
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Shift type
    type: {
        type: String,
        enum: ['morning', 'afternoon', 'night', 'custom'],
        default: 'custom'
    },

    // Start time
    startTime: {
        type: Date,
        required: true
    },

    // End time
    endTime: {
        type: Date,
        required: true
    },

    // Assigned zone(s)
    zones: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone'
    }],

    // Team members on this shift
    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['lead', 'member'], default: 'member' }
    }],

    // Status
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'cancelled'],
        default: 'scheduled'
    },

    // Notes
    notes: {
        type: String
    },

    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

// Indexes
ShiftSchema.index({ teamId: 1, startTime: 1 });
ShiftSchema.index({ status: 1 });
ShiftSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Shift', ShiftSchema);
