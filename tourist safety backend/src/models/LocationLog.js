const mongoose = require('mongoose');

const LocationLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  tourist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tourist' },
  latitude: Number,
  longitude: Number,
  rssi: Number,
  is_sos: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LocationLog', LocationLogSchema);