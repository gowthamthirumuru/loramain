/**
 * Conversation Routes
 */

const router = require('express').Router();
const conversationController = require('../controllers/conversationController');
const { validateObjectId } = require('../middleware/validator');

// GET /api/conversations - Get all conversations
router.get('/', conversationController.getAll);

// GET /api/conversations/:id - Get conversation by ID
router.get('/:id', validateObjectId('id'), conversationController.getById);

// POST /api/conversations - Create new conversation
router.post('/', conversationController.create);

// PATCH /api/conversations/:id/status - Update conversation status
router.patch('/:id/status', validateObjectId('id'), conversationController.updateStatus);

// GET /api/conversations/:id/messages - Get messages
router.get('/:id/messages', validateObjectId('id'), conversationController.getMessages);

// POST /api/conversations/:id/messages - Send message
router.post('/:id/messages', validateObjectId('id'), conversationController.sendMessage);

module.exports = router;
