/**
 * Conversation Controller - Stubbed
 */
const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

exports.getAll = asyncHandler(async (req, res) => {
    const conversations = await prisma.conversation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    const formatted = conversations.map(c => ({
        id: c.id,
        participant: c.participantName,
        type: c.type,
        status: c.status,
        lastMessage: c.messages[0]?.content || 'No messages',
        time: calculateTimeAgo(c.updatedAt),
        priority: c.priority,
        unread: c.unreadCount
    }));

    res.json(successResponse(formatted));
});

exports.getMessages = asyncHandler(async (req, res) => {
    const conversationId = parseInt(req.params.id);
    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
    });

    const formatted = messages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender,
        message: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwnMessage: m.isOwnMessage,
        read: m.read
    }));

    res.json(successResponse(formatted));
});

exports.sendMessage = asyncHandler(async (req, res) => {
    const conversationId = parseInt(req.params.id);
    const { message: content } = req.body;

    if (!content) throw new ApiError(400, 'Message content required');

    // Create Message
    const msg = await prisma.message.create({
        data: {
            conversationId,
            sender: 'Command Center', // Hardcoded for now
            content,
            isOwnMessage: true,
            read: true
        }
    });

    // Update Conversation
    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            updatedAt: new Date()
        }
    });

    // Return formatted message
    res.status(201).json(successResponse({
        id: msg.id,
        conversationId: msg.conversationId,
        sender: msg.sender,
        message: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwnMessage: msg.isOwnMessage
    }));
});

// Helper functions needed?
exports.create = asyncHandler(async (req, res) => {
    const { participant, type } = req.body;
    const conversation = await prisma.conversation.create({
        data: {
            participantName: participant,
            type: type || 'chat',
            status: 'active'
        }
    });
    res.status(201).json(successResponse(conversation));
});

exports.updateStatus = asyncHandler(async (req, res) => {
    // ... impl if needed
    res.json(successResponse(null, 'Not implemented yet'));
});

function calculateTimeAgo(date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Unknown';
    const diff = new Date() - parsedDate;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
exports.getById = (req, res) => { res.json({ success: true, data: {} }); };
exports.create = (req, res) => { res.status(201).json({ success: true, data: { id: 'stub-conversation' } }); };
exports.updateStatus = (req, res) => { res.json({ success: true, message: 'Status updated' }); };
exports.getMessages = (req, res) => { res.json({ success: true, data: [] }); };
exports.sendMessage = (req, res) => { res.status(201).json({ success: true, message: 'Message sent' }); };
