/**
 * User Controller
 * Admin user management
 */

const { prisma } = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

/**
 * Get All Users
 * GET /api/users
 */
exports.getAll = asyncHandler(async (req, res) => {
    const { role, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await prisma.user.findMany({
        where: filter,
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
            status: true,
            phone: true,
            lastLogin: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
    });

    const total = await prisma.user.count({ where: filter });

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
 * Create User (Admin only)
 * POST /api/users
 */
exports.create = asyncHandler(async (req, res) => {
    const { username, email, password, name, role, phone } = req.body;

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        throw new ApiError(409, 'User with this email or username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            salt,
            name,
            role: role || 'operator',
            phone
        }
    });

    // Remove sensitive data from response
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    delete safeUser.salt;

    res.status(201).json(successResponse(safeUser, 'User created successfully'));
});

/**
 * Get User by ID
 * GET /api/users/:id
 */
exports.getById = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
            status: true,
            phone: true,
            lastLogin: true,
            preferences: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json(successResponse(user));
});

/**
 * Update User
 * PUT /api/users/:id
 */
exports.update = asyncHandler(async (req, res) => {
    const { name, role, status, phone, email } = req.body;

    // TODO: Add unique check if email/username is changed

    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, role, status, phone, email },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                status: true,
                phone: true,
                updatedAt: true
            }
        });
        res.json(successResponse(user, 'User updated'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'User not found');
        }
        throw error;
    }
});

/**
 * Delete User
 * DELETE /api/users/:id
 */
exports.delete = asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
        throw new ApiError(400, 'Cannot delete your own account');
    }

    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json(successResponse(null, 'User deleted'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'User not found');
        }
        throw error;
    }
});

/**
 * Reset User Password
 * POST /api/users/:id/reset-password
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { passwordHash, salt, loginAttempts: 0, lockUntil: null }
        });
        res.json(successResponse(null, 'Password reset successfully'));
    } catch (error) {
        if (error.code === 'P2025') {
            throw new ApiError(404, 'User not found');
        }
        throw error;
    }
});
