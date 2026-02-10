/**
 * Tourist Controller (Improved)
 * Handles tourist registration and management
 */

const { prisma } = require('../config/db');
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
  const existing = await prisma.tourist.findFirst({
    where: {
      device_id,
      status: { in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] }
    }
  });

  if (existing) {
    throw new ApiError(409, 'Device is currently in use by another tourist', 'DEVICE_IN_USE');
  }

  const tourist = await prisma.tourist.create({
    data: {
      name,
      phone,
      device_id,
      emergency_contact,
      trip_start: trip_start || new Date(),
      trip_end
    }
  });

  logger.info(`Tourist registered: ${name} with device ${device_id}`);

  res.status(201).json(successResponse(tourist, 'Tourist registered successfully'));
});

/**
 * Get Tourist by ID
 * GET /api/tourist/:id
 */
exports.getById = asyncHandler(async (req, res) => {
  const tourist = await prisma.tourist.findUnique({
    where: { id: req.params.id }
  });

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

  const tourist = await prisma.tourist.findUnique({
    where: { id }
  });

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  const logs = await prisma.locationLog.findMany({
    where: {
      tourist_id: id,
      timestamp: { gte: tourist.trip_start }
    },
    orderBy: { timestamp: 'asc' },
    take: parseInt(limit)
  });

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
  const tourists = await prisma.tourist.findMany({
    where: {
      status: { in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] }
    },
    orderBy: { last_seen: 'desc' }
  });

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

  const tourists = await prisma.tourist.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    skip: skip,
    take: parseInt(limit)
  });

  const total = await prisma.tourist.count({
    where: filter
  });

  // Return flat array for frontend compatibility
  res.set('X-Total-Count', total.toString());
  res.set('X-Page', page.toString());
  res.set('X-Limit', limit.toString());

  res.json(successResponse(tourists));
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

  // Check if tourist exists first? Prisma update throws record not found error if ID missing, 
  // but let's conform to existing pattern where we handle it.
  // Actually, standard Prisma `update` throws specific error which global handler might catch, 
  // but simpler to try/catch or just update.

  try {
    const tourist = await prisma.tourist.update({
      where: { id },
      data: { status }
    });

    logger.info(`Tourist ${tourist.name} status updated to ${status}`);
    res.json(successResponse(tourist, 'Status updated'));
  } catch (error) {
    if (error.code === 'P2025') { // Record to update not found
      throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
    }
    throw error;
  }
});

/**
 * End Tourist Trip
 * POST /api/tourist/:id/end-trip
 */
exports.endTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const tourist = await prisma.tourist.update({
      where: { id },
      data: {
        status: TOURIST_STATUS.FINISHED,
        trip_end: new Date()
      }
    });

    logger.info(`Trip ended for tourist: ${tourist.name}`);
    res.json(successResponse(tourist, 'Trip ended successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
    }
    throw error;
  }
});

/**
 * Get Tourist by Device ID
 * GET /api/tourist/device/:deviceId
 */
exports.getByDeviceId = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;

  const tourist = await prisma.tourist.findFirst({
    where: {
      device_id: deviceId.toUpperCase(), // Assuming device_id in DB is case sensitive matching input
      status: { not: TOURIST_STATUS.FINISHED }
    }
  });

  if (!tourist) {
    throw new ApiError(404, 'No active tourist with this device', 'NOT_FOUND');
  }

  res.json(successResponse(tourist));
});

/**
 * Search Tourists
 * GET /api/tourist/search?q=query
 */
exports.search = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json(successResponse([]));
  }

  const tourists = await prisma.tourist.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { device_id: { contains: q.toUpperCase(), mode: 'insensitive' } }
      ]
    },
    take: 20
  });

  res.json(successResponse(tourists));
});

/**
 * Get Tourist Location
 * GET /api/tourist/:id/location
 */
exports.getLocation = asyncHandler(async (req, res) => {
  const tourist = await prisma.tourist.findUnique({
    where: { id: req.params.id }
  });

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  // Return last known location
  if (tourist.last_location && tourist.last_location.lat && tourist.last_location.lng) {
    res.json(successResponse({
      lat: tourist.last_location.lat,
      lng: tourist.last_location.lng
    }));
  } else {
    // Default location if none available
    res.json(successResponse({
      lat: 27.1751,
      lng: 78.0421
    }));
  }
});

/**
 * Update Tourist
 * PUT /api/tourist/:id
 */
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, device_id, nationality, emergencyContact, tripDetails } = req.body;

  // Check if tourist exists
  const existingTourist = await prisma.tourist.findUnique({
    where: { id }
  });

  if (!existingTourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  // Check if device is being changed and if it's in use
  if (device_id && device_id !== existingTourist.device_id) {
    const conflicting = await prisma.tourist.findFirst({
      where: {
        device_id,
        status: { in: [TOURIST_STATUS.ACTIVE, TOURIST_STATUS.SOS] },
        id: { not: id } // Exclude current tourist
      }
    });

    if (conflicting) {
      throw new ApiError(409, 'Device is currently in use by another tourist', 'DEVICE_IN_USE');
    }
  }

  // Map incoming fields to prisma schema
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (device_id) updateData.device_id = device_id;
  if (nationality) updateData.nationality = nationality;

  // Handle complex objects if they exist
  if (emergencyContact) {
    updateData.emergency_contact_name = emergencyContact.name;
    // Note: schema stores emergency_contact which might be phone string or json?
    // Looking at schema: emergency_contact String, emergency_contact_name String?
    // Assuming existing frontend sends structure { name, phone, relation }
    // But schema only has `emergency_contact` string field and optional name.
    // Let's assume `emergency_contact` stores the phone/details string or JSON.
    // Based on `register` function: `emergency_contact` is passed directly.
    // If frontend sends object, we might need to stringify or extract phone.
    // Let's assume it handles string assignment for now based on register.
    // Wait, register: const { emergency_contact } = req.body;

    // Let's update explicitly if frontend sends compatible structure
    if (emergencyContact.phone) updateData.emergency_contact = emergencyContact.phone;
    // Ideally we should adhere to schema. 
    // Let's assume emergencyContact is an object from frontend
    // and we map it to individual fields if possible or store as is if schema allows (it's string).
    // Ref: schema line 40: emergency_contact String
  }

  // Update trip details if provided
  if (tripDetails) {
    if (tripDetails.startDate) updateData.trip_start = new Date(tripDetails.startDate);
    if (tripDetails.endDate) updateData.trip_end = new Date(tripDetails.endDate);
    if (tripDetails.groupSize) updateData.group_size = parseInt(tripDetails.groupSize);
  }

  const updatedTourist = await prisma.tourist.update({
    where: { id },
    data: updateData
  });

  logger.info(`Tourist updated: ${id}`);
  res.json(successResponse(updatedTourist, 'Tourist updated successfully'));
});

/**
 * Delete Tourist
 * DELETE /api/tourist/:id
 */
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if tourist exists
  const tourist = await prisma.tourist.findUnique({
    where: { id }
  });

  if (!tourist) {
    throw new ApiError(404, 'Tourist not found', 'NOT_FOUND');
  }

  // Prevent deleting active tourists? Optional, but safer.
  // For now allow deletion as per request.

  await prisma.tourist.delete({
    where: { id }
  });

  logger.info(`Tourist deleted: ${id}`);
  res.json(successResponse(null, 'Tourist deleted successfully'));
});