/**
 * Anchor Model
 * Represents a LoRa anchor/relay node in the network
 */

const mongoose = require('mongoose');

const AnchorSchema = new mongoose.Schema({
    // Anchor identifier (e.g., "MASTER", "ANCHOR_2", "ANCHOR_3")
    anchor_id: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    // Display name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Position in local coordinate system (meters)
    local_position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },

    // GPS coordinates (for map display)
    gps_position: {
        lat: Number,
        lng: Number
    },

    // Current status
    status: {
        type: String,
        enum: ['online', 'offline', 'maintenance'],
        default: 'offline'
    },

    // Is this the master node?
    is_master: {
        type: Boolean,
        default: false
    },

    // Last heartbeat timestamp
    last_heartbeat: {
        type: Date,
        default: null
    },

    // Hardware info
    hardware: {
        device_type: { type: String, default: 'Raspberry Pi 4' },
        lora_module: { type: String, default: 'SX126x' },
        firmware_version: String
    },

    // Statistics
    stats: {
        total_pings_received: { type: Number, default: 0 },
        uptime_hours: { type: Number, default: 0 },
        last_rssi: Number
    },

    // Notes/Description
    notes: String

}, { timestamps: true });

// Index for quick status lookups
AnchorSchema.index({ status: 1 });
AnchorSchema.index({ is_master: 1 });

// Method to update heartbeat
AnchorSchema.methods.updateHeartbeat = function () {
    this.last_heartbeat = new Date();
    this.status = 'online';
    return this.save();
};

// Static to find online anchors
AnchorSchema.statics.findOnline = function () {
    return this.find({ status: 'online' });
};

// Static to find master node
AnchorSchema.statics.findMaster = function () {
    return this.findOne({ is_master: true });
};

module.exports = mongoose.model('Anchor', AnchorSchema);
