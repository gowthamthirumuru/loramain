/**
 * Anchor Routes
 * Endpoints for anchor management
 */

const router = require('express').Router();
const anchorController = require('../controllers/anchorController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Public route - get all anchors (for map display)
router.get('/', anchorController.getAll);

// Protected routes
router.get('/:id', authenticateJWT, anchorController.getById);
router.post('/', authenticateJWT, requireRole('admin'), anchorController.create);
router.put('/:id', authenticateJWT, requireRole('admin'), anchorController.update);
router.delete('/:id', authenticateJWT, requireRole('admin'), anchorController.delete);

module.exports = router;
