/**
 * Express Application Configuration
 * Main app setup with middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { authenticateGateway } = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const apiRoutes = require('./routes/index');

// =============== SWAGGER DOCUMENTATION ===============

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tourist Safety Backend API',
      version: '1.0.0',
      description: 'API for LoRa-based Tourist Safety System',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// =============== SECURITY MIDDLEWARE ===============

// Helmet for security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Sanitize data against XSS attacks
app.use(xss());

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tourist Safety API Docs'
}));

// Health check endpoint
const healthRoutes = require('./routes/healthRoutes');
app.use('/health', healthRoutes); // Mount at root /health for convenience? Or /api/health?
// The plan said /health and /health/detailed.
// The old one was app.get('/health'...)
// Let's replace the old app.get('/health') with this router.

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tourist Safety Backend is Running',
    version: '1.0.0',
    docs: '/api-docs'
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
