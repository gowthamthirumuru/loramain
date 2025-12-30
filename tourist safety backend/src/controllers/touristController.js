/**
 * Tourist Controller (Improved)
 * Handles tourist registration and management
 */

const Tourist = require('../models/Tourist');
const LocationLog = require('../models/LocationLog');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');
const { TOURIST_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Register a new Tourist
 * POST /api/tourist/register
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, phone, device_id, emergency_contact, trip_start, trip_end } = req.body;

  // Check if device is already in use
  const existing = await Tourist.findOne({
    device_id,
    status: { $in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] }
  });

  if (existing) {
    throw new ApiError(409, 'Device is currently in use by another tourist', 'DEVICE_IN_USE');
  }

  const tourist = new Tourist({
    name,
    phone,
    device_id,
    emergency_contact,
    trip_start: trip_start || new Date(),
    trip_end
  });

  await tourist.save();
  logger.info(`Tourist registered: ${name} with device ${device_id}`);

  res.status(201).json(successResponse(tourist, 'Tourist registered successfully'));
});

/**
 * Get Tourist by ID
 * GET /api/tourist/:id
 */
exports.getById = asyncHandler(async (req, res) => {
  const tourist = await Tourist.findById(req.params.id);

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  res.json(successResponse(tourist));
});

/**
 * Get Tourist with Location History
 * GET /api/tourist/:id/history
 */
exports.getHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 100 } = req.query;

  const tourist = await Tourist.findById(id);
  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const logs = await LocationLog.find({
    tourist_id: id,
    timestamp: { $gte: tourist.trip_start }
  })
    .sort({ timestamp: 1 })
    .limit(parseInt(limit));

  res.json(successResponse({
    tourist,
    history: logs,
    total_points: logs.length
  }));
});

/**
 * Get All Active Tourists
 * GET /api/tourist/active
 */
exports.getActive = asyncHandler(async (req, res) => {
  const tourists = await Tourist.find({
    status: { $in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] }
  }).sort({ last_seen: -1 });

  res.json(successResponse({
    count: tourists.length,
    tourists
  }));
});

/**
 * Get All Tourists (with filters)
 * GET /api/tourist
 */
exports.getAll = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tourists = await Tourist.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Tourist.countDocuments(filter);

  res.json(successResponse({
    tourists,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
});

/**
 * Update Tourist Status
 * PUT /api/tourist/:id/status
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Object.values(TOURIST_STATUS).includes(status)) {
    throw new ApiError(400, `Invalid status. Valid values: ${Object.values(TOURIST_STATUS).join(', ')}`, 'INVALID_STATUS');
  }

  const tourist = await Tourist.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  logger.info(`Tourist ${tourist.name} status updated to ${status}`);

  res.json(successResponse(tourist, 'Status updated'));
});

/**
 * End Tourist Trip
 * POST /api/tourist/:id/end-trip
 */
exports.endTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tourist = await Tourist.findById(id);

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  tourist.status = TOURIST_STATUS.FINISHED;
  tourist.trip_end = new Date();
  await tourist.save();

  logger.info(`Trip ended for tourist: ${tourist.name}`);

  res.json(successResponse(tourist, 'Trip ended successfully'));
});

/**
 * Get Tourist by Device ID
 * GET /api/tourist/device/:deviceId
 */
exports.getByDeviceId = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;

  const tourist = await Tourist.findOne({
    device_id: deviceId.toUpperCase(),
    status: { $ne: TOURIST_STATUS.FINISHED }
  });

  if (!tourist) {
    throw new ApiError(404, 'No active tourist with this device', 'NOT_FOUND');
  }

  res.json(successResponse(tourist));
});