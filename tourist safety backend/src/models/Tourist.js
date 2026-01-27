const mongoose = require('mongoose');

const TouristSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  emergency_contact: { type: String, required: true },
  emergency_contact_name: { type: String },
  device_id: { type: String, required: true, unique: true },

  // Trip details
  nationality: { type: String },
  group_size: { type: Number, default: 1 },
  trip_start: { type: Date, default: Date.now },
  trip_end: Date,

  // Status tracking
  status: {
    type: String,
    enum: ['registered', 'active', 'sos', 'offline', 'finished'],
    default: 'registered'
  },

  // Location data
  last_location: {
    x: Number,  // Meters from origin
    y: Number,
    lat: Number,
    lng: Number
  },
  last_seen: { type: Date, default: Date.now },

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date

}, { timestamps: true });

// Indexes for efficient queries
TouristSchema.index({ device_id: 1 });
TouristSchema.index({ status: 1 });
TouristSchema.index({ phone: 1 });
TouristSchema.index({ isDeleted: 1, status: 1 });
TouristSchema.index({ last_seen: -1 });

// Pre-find middleware to exclude soft-deleted by default
TouristSchema.pre(/^find/, function (next) {
  if (this.getQuery().includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Soft delete method
TouristSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Tourist', TouristSchema);
