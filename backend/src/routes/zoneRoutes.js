/**
 * Zone Routes
 * Zone/Geofence management
 */

const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: Geographic zone management
 */

// Public - get zones (for map display)
router.get('/', zoneController.getAll);
router.get('/:id', zoneController.getById);

// Protected - admin/operator only
router.post('/', authenticateJWT, requireRole('admin', 'operator'), zoneController.create);
router.put('/:id', authenticateJWT, requireRole('admin', 'operator'), zoneController.update);
router.patch('/:id/status', authenticateJWT, requireRole('admin', 'operator'), zoneController.toggleStatus);
router.delete('/:id', authenticateJWT, requireRole('admin'), zoneController.delete);

module.exports = router;
