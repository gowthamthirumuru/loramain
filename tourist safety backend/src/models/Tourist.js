const mongoose = require('mongoose');

const TouristSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  emergency_contact: { type: String, required: true },
  device_id: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['active', 'sos', 'offline', 'finished'], 
    default: 'active' 
  },
  last_location: {
    lat: Number,
    lng: Number
  },
  last_seen: { type: Date, default: Date.now },
  trip_start: { type: Date, default: Date.now },
  trip_end: Date
}, { timestamps: true });

module.exports = mongoose.model('Tourist', TouristSchema);