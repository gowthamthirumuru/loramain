/**
 * Location Controller (Improved)
 * Handles location updates from LoRa Gateway
 */

const { prisma } = require('../config/db');
const socketService = require('../utils/socketService');
const logger = require('../utils/logger');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { SOCKET_EVENTS, TOURIST_STATUS, LIMITS, GEO_BOUNDS } = require('../config/constants');

/**
 * Update Location from Gateway
 * POST /api/location/update
 * Accepts X,Y coordinates in meters (from trilateration)
 */
exports.updateLocation = asyncHandler(async (req, res) => {
  const { device_id, x, y, lat, lng, rssi, sos_flag } = req.body;

  // Find tourist with this device
  const tourist = await prisma.tourist.findUnique({
    where: { device_id }
  });

  if (!tourist) {
    throw new ApiError(404, 'Device not associated with active tourist', 'DEVICE_NOT_FOUND');
  }

  if (tourist.status === TOURIST_STATUS.FINISHED) {
    // Optional: Ignore updates for finished trips or log warning
  }

  // Save to location history
  const newLog = await prisma.locationLog.create({
    data: {
      device_id,
      tourist_id: tourist.id,
      x,
      y,
      lat,
      lng,
      rssi,
      is_sos: sos_flag || false
    }
  });

  // Update tourist's current status data
  let updateData = {
    last_location: { x, y, lat, lng },
    last_seen: new Date()
  };

  if (sos_flag) {
    updateData.status = TOURIST_STATUS.SOS;

    // Create SOS Alert
    const sosAlert = await prisma.sOSAlert.create({
      data: {
        tourist_id: tourist.id,
        device_id,
        location: { lat, lng }
      }
    });

    logger.logLocation(device_id, x, y, true);

    // Emit SOS alert via Socket.IO
    try {
      const io = socketService.getIO();
      io.emit(SOCKET_EVENTS.SOS_ALERT, {
        sos_id: sosAlert.id,
        tourist_id: tourist.id,
        tourist_name: tourist.name,
        phone: tourist.phone,
        emergency_contact: tourist.emergency_contact,
        location: { x, y, lat, lng },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Socket emit error:', err.message);
    }
  } else {
    // Only set to ACTIVE if not already SOS (to avoid clearing SOS status accidentally if packet didn't have flag but alert is ongoing - optional logic, but keeping simple for now matching old code)
    if (tourist.status !== TOURIST_STATUS.SOS) {
      updateData.status = TOURIST_STATUS.ACTIVE;
    }
  }

  const updatedTourist = await prisma.tourist.update({
    where: { id: tourist.id },
    data: updateData
  });

  // Emit real-time location update
  try {
    const io = socketService.getIO();
    io.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
      tourist_id: updatedTourist.id,
      name: updatedTourist.name,
      x,
      y,
      lat,
      lng,
      rssi,
      status: updatedTourist.status,
      sos: sos_flag || false,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Socket emit error:', err.message);
  }

  logger.logLocation(device_id, x, y, sos_flag);

  res.json(successResponse({
    tourist_id: updatedTourist.id,
    location: { x, y, lat, lng },
    status: updatedTourist.status
  }, 'Location updated successfully'));
});

/**
 * Get Location History for a Tourist
 * GET /api/location/:touristId
 */
exports.getHistory = asyncHandler(async (req, res) => {
  const { touristId } = req.params;
  const { limit = 100, page = 1 } = req.query;

  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId }
  });

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const logs = await prisma.locationLog.findMany({
    where: { tourist_id: touristId },
    orderBy: { timestamp: 'desc' },
    skip: skip,
    take: parseInt(limit)
  });

  const total = await prisma.locationLog.count({
    where: { tourist_id: touristId }
  });

  res.json(successResponse({
    tourist: {
      id: tourist.id,
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

  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId }
  });

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const latestLog = await prisma.locationLog.findFirst({
    where: { tourist_id: touristId },
    orderBy: { timestamp: 'desc' }
  });

  res.json(successResponse({
    tourist_id: tourist.id,
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
  const tourists = await prisma.tourist.findMany({
    where: {
      status: {
        in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS]
      }
    },
    select: {
      id: true,
      name: true,
      device_id: true,
      last_location: true,
      last_seen: true,
      status: true,
      phone: true
    }
  });

  res.json(successResponse({
    count: tourists.length,
    tourists: tourists
  }));
});

/**
 * Helper: Validate Coordinates against Geo Bounds
 */
const isValidCoordinate = (lat, lng) => {
  if (!lat || !lng) return false;
  return (
    lat >= GEO_BOUNDS.MIN_LAT &&
    lat <= GEO_BOUNDS.MAX_LAT &&
    lng >= GEO_BOUNDS.MIN_LNG &&
    lng <= GEO_BOUNDS.MAX_LNG
  );
};

/**
 * Batch Update Locations (for offline sync)
 * POST /api/location/batch-update
 */
exports.updateBatchLocation = asyncHandler(async (req, res) => {
  const { locations } = req.body;

  if (!Array.isArray(locations)) {
    throw new ApiError(400, 'Locations must be an array', 'INVALID_FORMAT');
  }

  if (locations.length > LIMITS.MAX_BATCH_SIZE) {
    throw new ApiError(400, `Batch size exceeds limit of ${LIMITS.MAX_BATCH_SIZE}`, 'BATCH_TOO_LARGE');
  }

  let processed = 0;
  let failed = 0;

  // Process in serial to avoid race conditions on same tourist status updates
  // or use Promise.all if independent. Serial is safer for logic order.
  for (const loc of locations) {
    try {
      const { device_id, x, y, lat, lng, rssi, sos_flag, timestamp } = loc;

      // Validate bounds if lat/lng provided
      if (lat && lng && !isValidCoordinate(lat, lng)) {
        logger.warn(`[Batch] Out of bounds coordinates for ${device_id}: ${lat}, ${lng}`);
        failed++;
        continue;
      }

      const tourist = await prisma.tourist.findUnique({ where: { device_id } });
      if (!tourist) {
        failed++;
        continue;
      }

      // Create log
      await prisma.locationLog.create({
        data: {
          device_id,
          tourist_id: tourist.id,
          x, y, lat, lng, rssi,
          is_sos: sos_flag || false,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      });

      // Update tourist latest status only if this log is newer than last_seen
      const logTime = timestamp ? new Date(timestamp) : new Date();
      if (!tourist.last_seen || logTime > tourist.last_seen) {
        let updateData = {
          last_location: { x, y, lat, lng },
          last_seen: logTime
        };

        if (sos_flag) updateData.status = TOURIST_STATUS.SOS;
        else if (tourist.status !== TOURIST_STATUS.SOS) updateData.status = TOURIST_STATUS.ACTIVE;

        await prisma.tourist.update({
          where: { id: tourist.id },
          data: updateData
        });
      }

      processed++;
    } catch (e) {
      logger.error(`[Batch] Error processing item for ${loc.device_id}: ${e.message}`);
      failed++;
    }
  }

  res.json(successResponse({ processed, failed }, 'Batch processing complete'));
});