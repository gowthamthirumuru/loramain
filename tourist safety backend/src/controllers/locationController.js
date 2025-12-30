/**
 * Location Controller (Improved)
 * Handles location updates from LoRa Gateway
 */

const Tourist = require('../models/Tourist');
const LocationLog = require('../models/LocationLog');
const SOSAlert = require('../models/SOSAlert');
const socketService = require('../utils/socketService');
const logger = require('../utils/logger');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { SOCKET_EVENTS, TOURIST_STATUS } = require('../config/constants');

/**
 * Update Location from Gateway
 * POST /api/location/update
 */
exports.updateLocation = asyncHandler(async (req, res) => {
  const { device_id, lat, lng, rssi, sos_flag } = req.body;

  // Find tourist with this device
  const tourist = await Tourist.findOne({
    device_id,
    status: { $ne: TOURIST_STATUS.FINISHED }
  });

  if (!tourist) {
    throw new ApiError(404, 'Device not associated with active tourist', 'DEVICE_NOT_FOUND');
  }

  // Save to location history
  const newLog = new LocationLog({
    device_id,
    tourist_id: tourist._id,
    latitude: lat,
    longitude: lng,
    rssi,
    is_sos: sos_flag || false
  });
  await newLog.save();

  // Update tourist's current status
  tourist.last_location = { lat, lng };
  tourist.last_seen = new Date();

  if (sos_flag) {
    tourist.status = TOURIST_STATUS.SOS;

    // Create SOS Alert
    const sosAlert = await SOSAlert.create({
      tourist_id: tourist._id,
      device_id,
      location: { lat, lng }
    });

    logger.logSOS(tourist.name, device_id, { lat, lng });

    // Emit SOS alert via Socket.IO
    try {
      const io = socketService.getIO();
      io.emit(SOCKET_EVENTS.SOS_ALERT, {
        sos_id: sosAlert._id,
        tourist_id: tourist._id,
        tourist_name: tourist.name,
        phone: tourist.phone,
        emergency_contact: tourist.emergency_contact,
        location: { lat, lng },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Socket emit error:', err.message);
    }
  } else {
    tourist.status = TOURIST_STATUS.ACTIVE;
  }

  await tourist.save();

  // Emit real-time location update
  try {
    const io = socketService.getIO();
    io.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
      tourist_id: tourist._id,
      name: tourist.name,
      lat,
      lng,
      rssi,
      status: tourist.status,
      sos: sos_flag || false,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Socket emit error:', err.message);
  }

  logger.logLocation(device_id, lat, lng, sos_flag);

  res.json(successResponse({
    tourist_id: tourist._id,
    location: { lat, lng },
    status: tourist.status
  }, 'Location updated successfully'));
});

/**
 * Get Location History for a Tourist
 * GET /api/location/:touristId
 */
exports.getHistory = asyncHandler(async (req, res) => {
  const { touristId } = req.params;
  const { limit = 100, page = 1 } = req.query;

  const tourist = await Tourist.findById(touristId);
  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const logs = await LocationLog.find({ tourist_id: touristId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await LocationLog.countDocuments({ tourist_id: touristId });

  res.json(successResponse({
    tourist: {
      id: tourist._id,
      name: tourist.name,
      device_id: tourist.device_id,
      current_status: tourist.status
    },
    history: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
});

/**
 * Get Latest Location for a Tourist
 * GET /api/location/:touristId/latest
 */
exports.getLatest = asyncHandler(async (req, res) => {
  const { touristId } = req.params;

  const tourist = await Tourist.findById(touristId);
  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const latestLog = await LocationLog.findOne({ tourist_id: touristId })
    .sort({ timestamp: -1 });

  res.json(successResponse({
    tourist_id: tourist._id,
    name: tourist.name,
    location: tourist.last_location,
    last_update: tourist.last_seen,
    status: tourist.status,
    latest_log: latestLog
  }));
});

/**
 * Get All Active Tourist Locations
 * GET /api/location/active
 */
exports.getAllActive = asyncHandler(async (req, res) => {
  const tourists = await Tourist.find({
    status: { $in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] }
  }).select('name device_id last_location last_seen status phone');

  res.json(successResponse({
    count: tourists.length,
    tourists: tourists.map(t => ({
      id: t._id,
      name: t.name,
      device_id: t.device_id,
      location: t.last_location,
      last_seen: t.last_seen,
      status: t.status
    }))
  }));
});