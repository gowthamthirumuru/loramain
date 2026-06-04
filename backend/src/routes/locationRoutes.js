/**
 * Location Routes
 */

const router = require('express').Router();
const locationController = require('../controllers/locationController');
const { validateLocationUpdate, validateObjectId } = require('../middleware/validator');
const { authenticateGateway } = require('../middleware/auth');
const { gatewayLimiter } = require('../middleware/rateLimiter');

// POST /api/location/update - Update location from gateway (protected)
router.post('/update',
    authenticateGateway,
    gatewayLimiter,
    validateLocationUpdate,
    locationController.updateLocation
);

// POST /api/location/batch-update - Batch update locations (offline sync)
router.post('/batch-update',
    authenticateGateway,
    gatewayLimiter,
    locationController.updateBatchLocation
);

// GET /api/location/active - Get all active tourist locations
router.get('/active', locationController.getAllActive);

// GET /api/location/:touristId - Get location history
router.get('/:touristId', validateObjectId('touristId'), locationController.getHistory);

// GET /api/location/:touristId/latest - Get latest location
router.get('/:touristId/latest', validateObjectId('touristId'), locationController.getLatest);

module.exports = router;
