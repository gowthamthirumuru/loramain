/**
 * Team Routes
 */

const router = require('express').Router();
const teamController = require('../controllers/teamController');
const { validateObjectId } = require('../middleware/validator');

// GET /api/teams - Get all teams
router.get('/', teamController.getAll);

// GET /api/teams/available - Get available teams
router.get('/available', teamController.getAvailable);

// GET /api/teams/:id - Get team by ID
router.get('/:id', validateObjectId('id'), teamController.getById);

// POST /api/teams - Create new team
router.post('/', teamController.create);

// PATCH /api/teams/:id/status - Update team status
router.patch('/:id/status', validateObjectId('id'), teamController.updateStatus);

// POST /api/teams/:id/deploy - Deploy team
router.post('/:id/deploy', validateObjectId('id'), teamController.deploy);

module.exports = router;
