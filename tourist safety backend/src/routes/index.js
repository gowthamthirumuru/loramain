/**
 * API Routes - Main Router
 * Aggregates all route modules
 */

const router = require('express').Router();

// Import route modules - Existing
const touristRoutes = require('./touristRoutes');
const locationRoutes = require('./locationRoutes');
const gatewayRoutes = require('./gatewayRoutes');
const adminRoutes = require('./adminRoutes');

// Import route modules - New for Dashboard Integration
const alertRoutes = require('./alertRoutes');
const emergencyRoutes = require('./emergencyRoutes');
const teamRoutes = require('./teamRoutes');
const conversationRoutes = require('./conversationRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// ========== Existing Routes (LoRa Gateway) ==========
router.use('/tourist', touristRoutes);
router.use('/location', locationRoutes);
router.use('/gateway', gatewayRoutes);
router.use('/sos', adminRoutes.sosRoutes);
router.use('/admin', adminRoutes.adminRoutes);

// ========== New Routes (Dashboard Integration) ==========
router.use('/alerts', alertRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/teams', teamRoutes);
router.use('/conversations', conversationRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

// Also expose tourists at /tourists for frontend compatibility
router.use('/tourists', touristRoutes);

module.exports = router;
