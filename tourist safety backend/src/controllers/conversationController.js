/**
 * Conversation Controller
 * Handles communication threads and messages
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get All Conversations
 * GET /api/conversations
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { status, priority } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const conversations = await Conversation.find(filter)
        .sort({ priority: 1, lastActivityAt: -1 });

    res.json(successResponse(conversations));
});

/**
 * Get Conversation by ID
 * GET /api/conversations/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
        throw new ApiError(404, 'Conversation not found', 'NOT_FOUND');
    }

    res.json(successResponse(conversation));
});

/**
 * Create Conversation
 * POST /api/conversations
 */
exports.create = asyncHandler(async (req, res) => {
    const { participant, type, priority, relatedTeamId, relatedTouristId, relatedEmergencyId } = req.body;

    const conversation = new Conversation({
        participant,
        type: type || 'radio',
        priority: priority || 'medium',
        relatedTeamId,
        relatedTouristId,
        relatedEmergencyId
    });

    await conversation.save();
    logger.info(`Conversation created with ${participant}`);

    res.status(201).json(successResponse(conversation, 'Conversation created'));
});

/**
 * Get Messages for Conversation
 * GET /api/conversations/:id/messages
 */
exports.getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
        throw new ApiError(404, 'Conversation not found', 'NOT_FOUND');
    }

    const filter = { conversationId: id };
    if (before) {
        filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
        { conversationId: id, read: false, isOwnMessage: false },
        { read: true }
    );

    // Reset unread count
    conversation.unread = 0;
    await conversation.save();

    res.json(successResponse(messages.reverse()));
});

/**
 * Send Message
 * POST /api/conversations/:id/messages
 */
exports.sendMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, sender = 'Command Center' } = req.body;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
        throw new ApiError(404, 'Conversation not found', 'NOT_FOUND');
    }

    const newMessage = new Message({
        conversationId: id,
        sender,
        message,
        isOwnMessage: sender === 'Command Center',
        read: true
    });

    await newMessage.save();
    logger.info(`Message sent in conversation ${id}`);

    res.status(201).json(successResponse(newMessage, 'Message sent'));
});

/**
 * Update Conversation Status
 * PATCH /api/conversations/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'waiting', 'standby', 'closed'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Valid values: ${validStatuses.join(', ')}`, 'INVALID_STATUS');
    }

    const conversation = await Conversation.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!conversation) {
        throw new ApiError(404, 'Conversation not found', 'NOT_FOUND');
    }

    res.json(successResponse(conversation, 'Status updated'));
});

module.exports = exports;
