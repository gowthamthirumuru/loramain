
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// All report routes require authentication, potentially admin/supervisor only
router.use(authenticateJWT);

router.get('/daily-activity', requireRole('admin', 'supervisor'), reportController.getDailyActivity);
router.get('/incidents', requireRole('admin', 'supervisor'), reportController.getIncidentSummary);
router.get('/stats', requireRole('admin', 'supervisor', 'officer'), reportController.getSystemStats);

module.exports = router;
