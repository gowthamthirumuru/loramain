/**
 * User Model
 * Admin and staff authentication
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    // Username (unique)
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Email
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Hashed password
    passwordHash: {
        type: String,
        required: true,
        select: false // Don't include in queries by default
    },

    // Salt for password hashing (legacy - bcryptjs stores salt in hash)
    salt: {
        type: String,
        required: false,
        select: false
    },

    // Display name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Role for access control
    role: {
        type: String,
        enum: ['admin', 'operator', 'viewer'],
        default: 'operator'
    },

    // Account status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },

    // Profile
    phone: String,
    avatar: String,

    // Security
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // Preferences
    preferences: {
        notifications: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: false }
    },

    // Refresh Token for JWT auth
    refreshToken: {
        type: String,
        select: false
    }

}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Password hashing method
UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

// Password verification method
UserSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
    return this.passwordHash === hash;
};

// Check if account is locked
UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
