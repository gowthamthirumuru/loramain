/**
 * Authentication Middleware
 * Handles JWT auth, API key auth, and role-based access control
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const logger = require('../utils/logger'); // Assuming logger exists

// ============================================
// JWT Authentication
// ============================================

/**
 * Verify JWT Token
 * Attaches user to request object
 */
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[DEBUG] Decoded:', decoded);

    // Find user using Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    console.log('[DEBUG] User found:', user ? 'Yes' : 'No', user);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Role-Based Access Control
 * Usage: requireRole('admin', 'operator')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// ============================================
// API Key Authentication (for LoRa Gateway)
// ============================================

/**
 * API Key Authentication for Gateway
 */
const authenticateGateway = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  // Skip auth for health check
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Check if API key is required for this route
  const protectedPaths = ['/api/location/update', '/api/gateway'];
  const isProtected = protectedPaths.some(path => req.path.startsWith(path));

  if (!isProtected) {
    return next();
  }

  // Validate API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  // Use strict equality check
  if (apiKey !== process.env.GATEWAY_API_KEY) {
    logger.warn(`Invalid API Key attempt from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

/**
 * Admin Token Authentication (for dashboard)
 */
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required',
      code: 'MISSING_TOKEN'
    });
  }

  // For now, simple token check. Upgrade to JWT later.
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  next();
};

module.exports = {
  authenticateJWT,
  requireRole,
  authenticateGateway,
  authenticateAdmin
};
