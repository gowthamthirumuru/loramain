/**
 * API Routes - Main Router
 * Aggregates all route modules
 */

const router = require('express').Router();

// Import route modules
const touristRoutes = require('./touristRoutes');
const locationRoutes = require('./locationRoutes');
const gatewayRoutes = require('./gatewayRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/tourist', touristRoutes);
router.use('/location', locationRoutes);
router.use('/gateway', gatewayRoutes);
router.use('/sos', adminRoutes.sosRoutes);
router.use('/admin', adminRoutes.adminRoutes);

module.exports = router;
