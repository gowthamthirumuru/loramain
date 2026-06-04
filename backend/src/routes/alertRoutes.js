/**
 * Alert Routes
 */

const router = require('express').Router();
const alertController = require('../controllers/alertController');
const { validateObjectId } = require('../middleware/validator');

// GET /api/alerts - Get all alerts
router.get('/', alertController.getAll);

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', validateObjectId('id'), alertController.getById);

// POST /api/alerts - Create new alert
router.post('/', alertController.create);

// PATCH /api/alerts/:id/status - Update alert status
router.patch('/:id/status', validateObjectId('id'), alertController.updateStatus);

// PATCH /api/alerts/:id/assign - Assign team to alert
router.patch('/:id/assign', validateObjectId('id'), alertController.assignTeam);

module.exports = router;
