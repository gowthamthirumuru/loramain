/**
 * Emergency Routes
 */

const router = require('express').Router();
const emergencyController = require('../controllers/emergencyController');
const { validateObjectId } = require('../middleware/validator');
const { sosLimiter } = require('../middleware/rateLimiter');

// GET /api/emergencies - Get all emergencies
router.get('/', emergencyController.getAll);

// GET /api/emergencies/:id - Get emergency by ID
router.get('/:id', validateObjectId('id'), emergencyController.getById);

// POST /api/emergencies - Create new emergency
router.post('/', sosLimiter, emergencyController.create);

// PATCH /api/emergencies/:id/status - Update emergency status
router.patch('/:id/status', validateObjectId('id'), emergencyController.updateStatus);

// PATCH /api/emergencies/:id/resolve - Resolve emergency
router.patch('/:id/resolve', validateObjectId('id'), emergencyController.resolve);

module.exports = router;
