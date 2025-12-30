/**
 * Admin Routes - SOS management and dashboard
 */

const router = require('express').Router();
const sosRouter = require('express').Router();
const adminController = require('../controllers/adminController');
const { validateSOSResolution, validateObjectId } = require('../middleware/validator');

// ========== SOS Routes (/api/sos) ==========

// GET /api/sos - Get all SOS alerts (with filters)
sosRouter.get('/', adminController.getAllSOS);

// GET /api/sos/active - Get active SOS alerts
sosRouter.get('/active', adminController.getActiveSOS);

// GET /api/sos/stats - Get SOS statistics
sosRouter.get('/stats', adminController.getStats);

// POST /api/sos/resolve - Resolve an SOS alert
sosRouter.post('/resolve', validateSOSResolution, adminController.resolveSOS);

// POST /api/sos/:id/false-alarm - Mark as false alarm
sosRouter.post('/:id/false-alarm', validateObjectId('id'), adminController.markFalseAlarm);

// ========== Admin Routes (/api/admin) ==========

// GET /api/admin/dashboard - Get dashboard summary
router.get('/dashboard', adminController.getDashboard);

module.exports = {
    sosRoutes: sosRouter,
    adminRoutes: router
};
