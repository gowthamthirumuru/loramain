/**
 * Device Routes
 */

const router = require('express').Router();
const deviceController = require('../controllers/deviceController');
const { validateObjectId } = require('../middleware/validator');

// POST /api/devices - Create new device
router.post('/', deviceController.create);

// GET /api/devices - Get all devices (with filters)
router.get('/', deviceController.getAll);

// PUT /api/devices/:id - Update device
router.put('/:id', validateObjectId('id'), deviceController.update);

// DELETE /api/devices/:id - Delete device
router.delete('/:id', validateObjectId('id'), deviceController.delete);

module.exports = router;
