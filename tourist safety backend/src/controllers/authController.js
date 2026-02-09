const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult, body } = require('express-validator');
const { prisma } = require('../config/db'); // Use Prisma
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { logAction } = require('./actionLogController');
const logger = require('../utils/logger');
// ============================================
// Validation Rules
// ============================================

exports.registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be 2-50 characters')
];

exports.loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// ============================================
// Helper Functions
// ============================================

/**
 * Generate JWT Token
 */
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/**
 * Validate request and throw error if invalid
 */
const validateRequest = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(e => e.msg).join(', ');
        throw new ApiError(400, errorMessages, 'VALIDATION_ERROR');
    }
};

// ============================================
// Controller Methods
// ============================================

/**
 * Register New User
 * POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
    validateRequest(req);

    const { username, email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new ApiError(400, 'Email already registered', 'EMAIL_EXISTS');
        }
        throw new ApiError(400, 'Username already taken', 'USERNAME_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const refreshToken = ""; // Placeholder, generated later

    // Create user
    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            salt, // Storing for legacy reasons if needed, though bcrypt in hash is safer
            name,
            phone,
            role: 'operator',
            refreshToken
        }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const tokenRefresh = generateRefreshToken(user.id); // Renamed to avoid const collision

    // Save refresh token
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokenRefresh }
    });

    logger.info(`New user registered: ${email}`);
    await logAction(user.id, 'REGISTER_USER', `User registered: ${email}`, req);

    res.status(201).json(successResponse({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
        },
        token,
        refreshToken: tokenRefresh
    }, 'Registration successful'));
});

/**
 * Login User
 * POST /api/auth/login
 */
exports.login = asyncHandler(async (req, res) => {
    validateRequest(req);

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if account is locked (using basic math since virtuals don't exist in Prisma)
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        throw new ApiError(423, 'Account is temporarily locked. Please try again later.', 'ACCOUNT_LOCKED');
    }

    // Check if account is active
    if (user.status !== 'active') {
        throw new ApiError(403, 'Account is not active. Please contact support.', 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        // Increment login attempts
        const attempts = (user.loginAttempts || 0) + 1;
        let lockUntil = user.lockUntil;

        // Lock account after 5 failed attempts
        if (attempts >= 5) {
            lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: attempts, lockUntil }
        });

        if (attempts >= 5) {
            throw new ApiError(423, 'Too many failed attempts. Account locked for 30 minutes.', 'ACCOUNT_LOCKED');
        }

        throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Reset login attempts keys on successful login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date(),
            refreshToken: generateRefreshToken(user.id) // Generate new refresh token
        }
    });

    // We need to fetch the updated user to get the new refreshToken
    const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.json(successResponse({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            preferences: user.preferences
        },
        token,
        refreshToken: updatedUser.refreshToken
    }, 'Login successful'));
});

/**
 * Logout User
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res) => {
    // Clear refresh token
    if (req.user) {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null }
        });
        logger.info(`User logged out: ${req.user.email}`);
    }

    res.json(successResponse(null, 'Logged out successfully'));
});

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required', 'MISSING_TOKEN');
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            throw new ApiError(400, 'Invalid token type', 'INVALID_TOKEN');
        }

        // Find user with matching refresh token
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, 'Invalid refresh token', 'INVALID_TOKEN');
        }

        if (user.status !== 'active') {
            throw new ApiError(403, 'Account is not active', 'ACCOUNT_INACTIVE');
        }

        // Generate new tokens
        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken }
        });

        res.json(successResponse({
            token: newToken,
            refreshToken: newRefreshToken
        }, 'Token refreshed'));

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_TOKEN');
    }
});

/**
 * Get Current User
 * GET /api/auth/me
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        throw new ApiError(404, 'User not found', 'NOT_FOUND');
    }

    res.json(successResponse({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    }));
});

/**
 * Update Password
 * PUT /api/auth/password
 */
exports.updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current password and new password are required', 'MISSING_FIELDS');
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, 'New password must be at least 8 characters', 'WEAK_PASSWORD');
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, salt }
    });

    logger.info(`Password updated for user: ${user.email}`);

    res.json(successResponse(null, 'Password updated successfully'));
});



module.exports = exports;
