/**
 * Dashboard Routes
 */

const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/metrics - Get dashboard KPIs
router.get('/metrics', dashboardController.getMetrics);

// GET /api/dashboard/analytics - Get analytics data
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
