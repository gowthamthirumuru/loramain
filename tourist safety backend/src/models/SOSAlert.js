/**
 * SOS Alert Model (Improved)
 * Tracks emergency alerts from tourists
 */

const mongoose = require('mongoose');

const SOSAlertSchema = new mongoose.Schema({
  // Reference to tourist
  tourist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tourist',
    required: true
  },

  // Device that triggered the alert
  device_id: {
    type: String,
    required: true
  },

  // Location when SOS was triggered
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  // Alert status
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active'
  },

  // Resolution details
  resolved_at: Date,
  resolved_by: String,
  notes: String,

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

// Indexes for efficient queries
SOSAlertSchema.index({ status: 1 });
SOSAlertSchema.index({ tourist_id: 1 });
SOSAlertSchema.index({ created_at: -1 });
SOSAlertSchema.index({ device_id: 1, status: 1 });

// Virtual for response time calculation
SOSAlertSchema.virtual('response_time_minutes').get(function () {
  if (!this.resolved_at) return null;
  const diff = this.resolved_at - this.created_at;
  return Math.round(diff / 60000); // Convert ms to minutes
});

// Ensure virtuals are included in JSON output
SOSAlertSchema.set('toJSON', { virtuals: true });
SOSAlertSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SOSAlert', SOSAlertSchema);