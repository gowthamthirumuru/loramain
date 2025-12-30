/**
 * Location Log Model
 * Stores location history for tourists (X,Y coordinates in meters)
 */

const mongoose = require('mongoose');

const LocationLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  tourist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tourist' },

  // X,Y coordinates in meters (from trilateration)
  x: { type: Number, required: true },
  y: { type: Number, required: true },

  rssi: Number,
  is_sos: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for efficient queries
LocationLogSchema.index({ tourist_id: 1, timestamp: -1 });
LocationLogSchema.index({ device_id: 1, timestamp: -1 });

module.exports = mongoose.model('LocationLog', LocationLogSchema);