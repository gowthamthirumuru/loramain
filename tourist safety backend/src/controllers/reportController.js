/**
 * Report Controller
 * Handles report generation and management
 */

const Report = require('../models/Report');
const Tourist = require('../models/Tourist');
const SOSAlert = require('../models/SOSAlert');
const Emergency = require('../models/Emergency');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get All Reports
 * GET /api/reports
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { type, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json(successResponse({
        reports,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }));
});

/**
 * Get Report by ID
 * GET /api/reports/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        throw new ApiError(404, 'Report not found', 'NOT_FOUND');
    }

    res.json(successResponse(report));
});

/**
 * Generate Report
 * POST /api/reports/generate
 */
exports.generate = asyncHandler(async (req, res) => {
    const { templateId, dateRange, format = 'pdf', type = 'custom', name } = req.body;

    // Create report record
    const report = new Report({
        name: name || `Report - ${new Date().toLocaleDateString()}`,
        type,
        dateRange: dateRange || 'Last 7 days',
        status: 'processing',
        createdBy: req.user?.name || 'Admin'
    });

    await report.save();

    // Generate report data (simplified - in production would be async job)
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const [totalTourists, totalAlerts, resolvedAlerts] = await Promise.all([
            Tourist.countDocuments({ trip_start: { $gte: startDate } }),
            SOSAlert.countDocuments({ created_at: { $gte: startDate } }),
            SOSAlert.countDocuments({
                status: 'resolved',
                resolved_at: { $gte: startDate }
            })
        ]);

        report.data = {
            period: { start: startDate, end: endDate },
            summary: {
                totalTourists,
                totalAlerts,
                resolvedAlerts,
                responseRate: totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 100
            }
        };

        report.status = 'completed';
        report.size = '1.2 MB';
        await report.save();

        logger.info(`Report generated: ${report.name}`);
    } catch (error) {
        report.status = 'failed';
        report.error = error.message;
        await report.save();
        logger.error(`Report generation failed: ${error.message}`);
    }

    res.status(201).json(successResponse(report, 'Report generation started'));
});

/**
 * Download Report
 * GET /api/reports/:id/download
 */
exports.download = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        throw new ApiError(404, 'Report not found', 'NOT_FOUND');
    }

    if (report.status !== 'completed') {
        throw new ApiError(400, 'Report is not ready for download', 'NOT_READY');
    }

    // Increment download count
    report.downloads = (report.downloads || 0) + 1;
    await report.save();

    // For now, return report data as JSON
    // In production, would return actual file
    res.json(successResponse({
        report,
        downloadUrl: `/api/reports/${report._id}/file`
    }));
});

module.exports = exports;
