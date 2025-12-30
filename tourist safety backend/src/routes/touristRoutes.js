/**
 * Tourist Routes
 */

const router = require('express').Router();
const touristController = require('../controllers/touristController');
const { validateTouristRegistration, validateObjectId } = require('../middleware/validator');

// POST /api/tourist/register - Register new tourist
router.post('/register', validateTouristRegistration, touristController.register);

// GET /api/tourist - Get all tourists (with filters)
router.get('/', touristController.getAll);

// GET /api/tourist/active - Get all active tourists
router.get('/active', touristController.getActive);

// GET /api/tourist/device/:deviceId - Get tourist by device ID
router.get('/device/:deviceId', touristController.getByDeviceId);

// GET /api/tourist/:id - Get tourist by ID
router.get('/:id', validateObjectId('id'), touristController.getById);

// GET /api/tourist/:id/history - Get tourist with location history
router.get('/:id/history', validateObjectId('id'), touristController.getHistory);

// PUT /api/tourist/:id/status - Update tourist status
router.put('/:id/status', validateObjectId('id'), touristController.updateStatus);

// POST /api/tourist/:id/end-trip - End tourist trip
router.post('/:id/end-trip', validateObjectId('id'), touristController.endTrip);

module.exports = router;
