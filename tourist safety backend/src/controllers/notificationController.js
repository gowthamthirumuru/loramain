/**
 * Notification Controller
 * Manage user notifications
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for current user
 *     tags: [Notifications]
 */
exports.getMyNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json(successResponse({
        notifications,
        unreadCount,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }));
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 */
exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { read: true, readAt: new Date() },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    res.json(successResponse(notification, 'Marked as read'));
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true, readAt: new Date() }
    );

    res.json(successResponse(null, 'All notifications marked as read'));
});

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Send notification to user(s)
 *     tags: [Notifications]
 */
exports.send = asyncHandler(async (req, res) => {
    const { userIds, type, title, message, severity, relatedTo, actionUrl } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError(400, 'userIds array is required');
    }

    if (!type || !title || !message) {
        throw new ApiError(400, 'type, title, and message are required');
    }

    const notifications = await Notification.insertMany(
        userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            severity: severity || 'info',
            relatedTo,
            actionUrl
        }))
    );

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
        userIds.forEach(userId => {
            io.to(`user:${userId}`).emit('notification', {
                type,
                title,
                message,
                severity
            });
        });
    }

    res.status(201).json(successResponse(notifications, `Sent ${notifications.length} notifications`));
});

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Broadcast notification to all users
 *     tags: [Notifications]
 */
exports.broadcast = asyncHandler(async (req, res) => {
    const { type, title, message, severity, roles } = req.body;

    if (!type || !title || !message) {
        throw new ApiError(400, 'type, title, and message are required');
    }

    // Find target users
    const filter = { status: 'active' };
    if (roles && roles.length > 0) filter.role = { $in: roles };

    const users = await User.find(filter).select('_id');

    if (users.length === 0) {
        return res.json(successResponse(null, 'No users to notify'));
    }

    const notifications = await Notification.insertMany(
        users.map(user => ({
            userId: user._id,
            type,
            title,
            message,
            severity: severity || 'info'
        }))
    );

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
        io.emit('notification', { type, title, message, severity });
    }

    res.status(201).json(successResponse(null, `Broadcast to ${notifications.length} users`));
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 */
exports.delete = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    res.json(successResponse(null, 'Notification deleted'));
});
