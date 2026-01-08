/**
 * Zone Model
 * Geofenced areas for monitoring
 */

const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
    // Zone name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Zone type
    type: {
        type: String,
        enum: ['safe', 'restricted', 'danger', 'checkpoint', 'emergency_meeting'],
        default: 'safe'
    },

    // Zone boundary (polygon coordinates)
    boundary: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of [lng, lat] pairs
            required: true
        }
    },

    // Center point for display
    center: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },

    // Zone color for map display
    color: {
        type: String,
        default: '#3388ff'
    },

    // Alert settings
    alerts: {
        onEntry: { type: Boolean, default: false },
        onExit: { type: Boolean, default: false },
        onStay: { type: Boolean, default: false },
        stayDurationMinutes: { type: Number, default: 30 }
    },

    // Max capacity (for crowd control)
    maxCapacity: Number,
    currentCount: { type: Number, default: 0 },

    // Status
    isActive: { type: Boolean, default: true },

    // Description
    description: String

}, { timestamps: true });

// 2dsphere index for geospatial queries
ZoneSchema.index({ boundary: '2dsphere' });
ZoneSchema.index({ type: 1 });
ZoneSchema.index({ isActive: 1 });

// Static to find zone containing a point
ZoneSchema.statics.findContaining = function (lat, lng) {
    return this.find({
        isActive: true,
        boundary: {
            $geoIntersects: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                }
            }
        }
    });
};

module.exports = mongoose.model('Zone', ZoneSchema);
