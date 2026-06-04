
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Public/Gateway accessible settings (read-only)
// Note: You might want to protect this with Gateway API Key as well if sensitive
router.get('/settings', systemController.getSettings);

// Admin only updates
router.put('/settings', authenticateJWT, requireRole('admin'), systemController.updateSettings);

module.exports = router;
