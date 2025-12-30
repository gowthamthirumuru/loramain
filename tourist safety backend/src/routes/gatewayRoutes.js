/**
 * Gateway Routes - For LoRa Master Node communication
 */

const router = require('express').Router();
const gatewayController = require('../controllers/gatewayController');
const { authenticateGateway } = require('../middleware/auth');
const { gatewayLimiter } = require('../middleware/rateLimiter');

// All gateway routes require API key authentication
router.use(authenticateGateway);

// POST /api/gateway/heartbeat - Gateway status ping
router.post('/heartbeat', gatewayController.heartbeat);

// POST /api/gateway/batch-update - Bulk location updates
router.post('/batch-update', gatewayLimiter, gatewayController.batchUpdate);

// GET /api/gateway/config - Get anchor configuration
router.get('/config', gatewayController.getConfig);

// GET /api/gateway/anchors - Get all anchors
router.get('/anchors', gatewayController.getAllAnchors);

// POST /api/gateway/anchors - Register/update anchor
router.post('/anchors', gatewayController.registerAnchor);

// PUT /api/gateway/anchors/:id/status - Update anchor status
router.put('/anchors/:id/status', gatewayController.updateAnchorStatus);

module.exports = router;
