/**
 * Report Model
 * Generated reports for analytics and compliance
 */

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Report name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Report type
    type: {
        type: String,
        enum: ['incident', 'analysis', 'tourism', 'performance', 'risk', 'custom'],
        default: 'custom'
    },

    // Date range covered
    dateRange: {
        type: String,
        default: 'Last 7 days'
    },

    // Start and end dates
    startDate: Date,
    endDate: Date,

    // Who created the report
    createdBy: {
        type: String,
        default: 'Admin'
    },

    // Generation status
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },

    // File size
    size: String,

    // Download count
    downloads: {
        type: Number,
        default: 0
    },

    // File path or URL for download
    filePath: String,
    downloadUrl: String,

    // Report data (for simple reports stored in DB)
    data: {
        type: mongoose.Schema.Types.Mixed
    },

    // Error message if failed
    error: String

}, { timestamps: true });

// Indexes
ReportSchema.index({ status: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdAt: -1 });

// Method to mark as completed
ReportSchema.methods.complete = function (filePath, size) {
    this.status = 'completed';
    this.filePath = filePath;
    this.size = size;
    return this.save();
};

// Method to mark as failed
ReportSchema.methods.fail = function (error) {
    this.status = 'failed';
    this.error = error;
    return this.save();
};

module.exports = mongoose.model('Report', ReportSchema);
