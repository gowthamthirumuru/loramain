/**
 * Notification Controller - Stubbed
 */
const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

exports.getMyNotifications = asyncHandler(async (req, res) => {
    // Assuming auth middleware sets req.user
    const userId = req.user ? req.user.id : null;

    // Fetch notifications (either global or user-specific)
    const notifications = await prisma.notification.findMany({
        where: {
            OR: [
                { userId: null }, // Global
                { userId: userId } // User specific
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const formatted = notifications.map(n => ({
        ...n,
        time: calculateTimeAgo(n.createdAt)
    }));

    res.json(successResponse(formatted));
});

exports.markAsRead = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma.notification.update({
        where: { id },
        data: { read: true }
    });
    res.json(successResponse(null, 'Marked as read'));
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    await prisma.notification.updateMany({
        where: {
            OR: [
                { userId: null },
                { userId: userId }
            ],
            read: false
        },
        data: { read: true }
    });
    res.json(successResponse(null, 'All marked as read'));
});

exports.delete = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma.notification.delete({ where: { id } });
    res.json(successResponse(null, 'Deleted'));
});

// Admin/System internal use
exports.create = asyncHandler(async (req, res) => {
    const { type, title, message, severity, userId } = req.body;
    const notification = await prisma.notification.create({
        data: { type, title, message, severity, userId }
    });
    res.status(201).json(successResponse(notification));
});

function calculateTimeAgo(date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Unknown time';

    const diff = new Date() - parsedDate;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
}
exports.markAsRead = (req, res) => { res.json({ success: true, message: 'Marked as read' }); };
exports.markAllAsRead = (req, res) => { res.json({ success: true, message: 'All marked as read' }); };
exports.delete = (req, res) => { res.json({ success: true, message: 'Deleted' }); };
exports.send = (req, res) => { res.status(201).json({ success: true, message: 'Notification sent' }); };
exports.broadcast = (req, res) => { res.status(201).json({ success: true, message: 'Broadcast sent' }); };
