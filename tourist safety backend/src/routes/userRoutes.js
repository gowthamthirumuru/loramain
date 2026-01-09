/**
 * User Routes
 * User management (admin only)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// All routes require auth + admin role
router.use(authenticateJWT);
router.use(requireRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only)
 */

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;
