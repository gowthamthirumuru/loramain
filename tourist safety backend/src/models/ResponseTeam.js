/**
 * Response Team Model
 * Represents emergency response teams (Medical, Security, Tourist Aid, Search & Rescue)
 */

const mongoose = require('mongoose');

const ResponseTeamSchema = new mongoose.Schema({
    // Team identifier
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Team type
    type: {
        type: String,
        enum: ['Medical', 'Security', 'Tourist Aid', 'Search & Rescue'],
        required: true
    },

    // Current status
    status: {
        type: String,
        enum: ['available', 'responding', 'patrol', 'offline'],
        default: 'available'
    },

    // Current location description
    location: {
        type: String,
        default: 'Base Station'
    },

    // GPS coordinates
    coordinates: {
        lat: Number,
        lng: Number
    },

    // Number of team members
    members: {
        type: Number,
        default: 4
    },

    // Estimated time of arrival (when responding)
    eta: String,

    // Current assignment ID (emergency/alert)
    currentAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Emergency',
        default: null
    },

    // Contact information
    contact: {
        phone: String,
        radio_channel: String
    },

    // Team leader
    leader: {
        name: String,
        phone: String
    }

}, { timestamps: true });

// Indexes
ResponseTeamSchema.index({ status: 1 });
ResponseTeamSchema.index({ type: 1 });

// Static to find available teams
ResponseTeamSchema.statics.findAvailable = function () {
    return this.find({ status: 'available' });
};

// Method to deploy team
ResponseTeamSchema.methods.deploy = function (assignmentId, eta) {
    this.status = 'responding';
    this.currentAssignment = assignmentId;
    this.eta = eta;
    return this.save();
};

// Method to mark as available
ResponseTeamSchema.methods.release = function () {
    this.status = 'available';
    this.currentAssignment = null;
    this.eta = null;
    return this.save();
};

module.exports = mongoose.model('ResponseTeam', ResponseTeamSchema);
