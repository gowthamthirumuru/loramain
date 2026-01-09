/**
 * User Controller
 * CRUD operations for user management (admin only)
 */

const User = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, status } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
        .select('-passwordHash -salt -refreshToken')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json(successResponse({
        users,
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
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 */
exports.getById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-passwordHash -salt -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json(successResponse(user));
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 */
exports.create = asyncHandler(async (req, res) => {
    const { username, email, password, name, role, phone } = req.body;

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        throw new ApiError(400, 'User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        username,
        email,
        passwordHash,
        name,
        role: role || 'operator',
        phone
    });

    res.status(201).json(successResponse({
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
    }, 'User created successfully'));
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 */
exports.update = asyncHandler(async (req, res) => {
    const { name, role, status, phone, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, role, status, phone, preferences },
        { new: true, runValidators: true }
    ).select('-passwordHash -salt -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json(successResponse(user, 'User updated'));
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete - set status to inactive)
 *     tags: [Users]
 */
exports.delete = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: 'inactive' },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json(successResponse(null, 'User deactivated'));
});

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (admin)
 *     tags: [Users]
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { passwordHash, loginAttempts: 0, lockUntil: null }
    );

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json(successResponse(null, 'Password reset successfully'));
});
