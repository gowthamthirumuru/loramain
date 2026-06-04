/**
 * API Routes - Main Router
 * Aggregates all route modules
 */

const router = require('express').Router();

// Import Auth Routes (Authentication)
const authRoutes = require('./authRoutes');

// Import route modules - Existing
const touristRoutes = require('./touristRoutes');
const locationRoutes = require('./locationRoutes');
const gatewayRoutes = require('./gatewayRoutes');
const adminRoutes = require('./adminRoutes');

// Import route modules - Dashboard Integration
const alertRoutes = require('./alertRoutes');
const emergencyRoutes = require('./emergencyRoutes');
const teamRoutes = require('./teamRoutes');
const conversationRoutes = require('./conversationRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Import route modules - Phase 1.3 New Endpoints
const userRoutes = require('./userRoutes');
const zoneRoutes = require('./zoneRoutes');
const notificationRoutes = require('./notificationRoutes');
const systemRoutes = require('./systemRoutes');
const anchorRoutes = require('./anchorRoutes');
const deviceRoutes = require('./deviceRoutes');

// ========== Authentication Routes ==========
router.use('/auth', authRoutes);

// ========== Existing Routes (LoRa Gateway) ==========
router.use('/tourist', touristRoutes);
router.use('/location', locationRoutes);
router.use('/gateway', gatewayRoutes);
router.use('/sos', adminRoutes.sosRoutes);
router.use('/admin', adminRoutes.adminRoutes);

// ========== Dashboard Routes ==========
router.use('/alerts', alertRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/teams', teamRoutes);
router.use('/conversations', conversationRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

// ========== Phase 1.3 New Routes ==========
router.use('/users', userRoutes);
router.use('/zones', zoneRoutes);
router.use('/notifications', notificationRoutes);
router.use('/system', systemRoutes);
router.use('/anchors', anchorRoutes);
router.use('/devices', deviceRoutes);

// Also expose tourists at /tourists for frontend compatibility
router.use('/tourists', touristRoutes);

module.exports = router;

