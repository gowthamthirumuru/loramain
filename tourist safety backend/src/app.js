/**
 * Express Application Configuration
 * Main app setup with middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { authenticateGateway } = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const apiRoutes = require('./routes/index');

// =============== SECURITY MIDDLEWARE ===============

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// =============== PARSING MIDDLEWARE ===============

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// =============== LOGGING ===============

// Request logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// =============== RATE LIMITING ===============

// Apply general rate limiting to all requests
app.use(generalLimiter);

// =============== ROUTES ===============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tourist Safety Backend is Running',
    version: '1.0.0',
    docs: '/api/docs' // TODO: Add swagger docs
  });
});

// API Routes
app.use('/api', apiRoutes);

// =============== ERROR HANDLING ===============

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;