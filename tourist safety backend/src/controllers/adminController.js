/**
 * Admin Controller (Improved)
 * Handles SOS alerts and admin operations
 */

const SOSAlert = require('../models/SOSAlert');
const Tourist = require('../models/Tourist');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { TOURIST_STATUS, SOS_STATUS, SOCKET_EVENTS } = require('../config/constants');
const socketService = require('../utils/socketService');
const logger = require('../utils/logger');

/**
 * Get All Active SOS Alerts
 * GET /api/sos/active
 */
exports.getActiveSOS = asyncHandler(async (req, res) => {
  const alerts = await SOSAlert.find({ status: SOS_STATUS.ACTIVE })
    .populate('tourist_id', 'name phone emergency_contact device_id')
    .sort({ created_at: -1 });

  res.json(successResponse({
    count: alerts.length,
    alerts
  }));
});

/**
 * Get All SOS Alerts (with filters)
 * GET /api/sos
 */
exports.getAllSOS = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const alerts = await SOSAlert.find(filter)
    .populate('tourist_id', 'name phone emergency_contact device_id')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await SOSAlert.countDocuments(filter);

  res.json(successResponse({
    alerts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
});

/**
 * Resolve an SOS Alert
 * POST /api/sos/resolve
 */
exports.resolveSOS = asyncHandler(async (req, res) => {
  const { sos_id, admin_name, notes } = req.body;

  const alert = await SOSAlert.findById(sos_id);

  if (!alert) {
    throw new ApiError(404, 'SOS Alert not found', 'NOT_FOUND');
  }

  if (alert.status === SOS_STATUS.RESOLVED) {
    throw new ApiError(400, 'SOS Alert already resolved', 'ALREADY_RESOLVED');
  }

  alert.status = SOS_STATUS.RESOLVED;
  alert.resolved_at = new Date();
  alert.resolved_by = admin_name || 'Admin';
  if (notes) alert.notes = notes;

  await alert.save();

  // Update tourist status back to active
  if (alert.tourist_id) {
    await Tourist.findByIdAndUpdate(alert.tourist_id, {
      status: TOURIST_STATUS.ACTIVE
    });
  }

  // Emit resolution event
  try {
    const io = socketService.getIO();
    io.emit(SOCKET_EVENTS.SOS_RESOLVED, {
      sos_id: alert._id,
      resolved_by: alert.resolved_by,
      resolved_at: alert.resolved_at
    });
  } catch (err) {
    logger.error('Socket emit error:', err.message);
  }

  logger.info(`SOS resolved by ${alert.resolved_by}`, { sos_id: alert._id });

  res.json(successResponse(alert, 'SOS Alert resolved'));
});

/**
 * Mark SOS as False Alarm
 * POST /api/sos/:id/false-alarm
 */
exports.markFalseAlarm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { admin_name, reason } = req.body;

  const alert = await SOSAlert.findById(id);

  if (!alert) {
    throw new ApiError(404, 'SOS Alert not found', 'NOT_FOUND');
  }

  alert.status = SOS_STATUS.FALSE_ALARM;
  alert.resolved_at = new Date();
  alert.resolved_by = admin_name || 'Admin';
  alert.notes = reason || 'Marked as false alarm';

  await alert.save();

  // Update tourist status back to active
  if (alert.tourist_id) {
    await Tourist.findByIdAndUpdate(alert.tourist_id, {
      status: TOURIST_STATUS.ACTIVE
    });
  }

  logger.info(`SOS marked as false alarm by ${alert.resolved_by}`, { sos_id: alert._id });

  res.json(successResponse(alert, 'Marked as false alarm'));
});

/**
 * Get SOS Statistics
 * GET /api/sos/stats
 */
exports.getStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, active, todayCount, resolvedToday] = await Promise.all([
    SOSAlert.countDocuments(),
    SOSAlert.countDocuments({ status: SOS_STATUS.ACTIVE }),
    SOSAlert.countDocuments({ created_at: { $gte: today } }),
    SOSAlert.countDocuments({
      status: SOS_STATUS.RESOLVED,
      resolved_at: { $gte: today }
    })
  ]);

  res.json(successResponse({
    total_alerts: total,
    active_alerts: active,
    today_alerts: todayCount,
    resolved_today: resolvedToday
  }));
});

/**
 * Get Dashboard Summary
 * GET /api/admin/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const [
    activeTourists,
    sosTourists,
    offlineTourists,
    activeAlerts,
    totalToday
  ] = await Promise.all([
    Tourist.countDocuments({ status: TOURIST_STATUS.ACTIVE }),
    Tourist.countDocuments({ status: TOURIST_STATUS.SOS }),
    Tourist.countDocuments({ status: TOURIST_STATUS.OFFLINE }),
    SOSAlert.countDocuments({ status: SOS_STATUS.ACTIVE }),
    Tourist.countDocuments({ trip_start: { $gte: new Date().setHours(0, 0, 0, 0) } })
  ]);

  // Get recent alerts
  const recentAlerts = await SOSAlert.find({ status: SOS_STATUS.ACTIVE })
    .populate('tourist_id', 'name phone')
    .sort({ created_at: -1 })
    .limit(5);

  res.json(successResponse({
    tourists: {
      active: activeTourists,
      sos: sosTourists,
      offline: offlineTourists,
      registered_today: totalToday
    },
    alerts: {
      active: activeAlerts,
      recent: recentAlerts
    },
    timestamp: new Date().toISOString()
  }));
});