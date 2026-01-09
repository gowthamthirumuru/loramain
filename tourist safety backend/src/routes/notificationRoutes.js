/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

// All routes require authentication
router.use(authenticateJWT);

// User notifications
router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.delete);

// Admin only - send notifications
router.post('/', requireRole('admin', 'operator'), notificationController.send);
router.post('/broadcast', requireRole('admin'), notificationController.broadcast);

module.exports = router;
