/**
 * Anchor Controller
 * Handles anchor management endpoints
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('express-async-handler');
const { successResponse } = require('../utils/helpers');

/**
 * GET /api/anchors
 * Get all anchors
 */
exports.getAll = asyncHandler(async (req, res) => {
    const anchors = await prisma.anchor.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(successResponse(anchors, 'Anchors retrieved'));
});

/**
 * GET /api/anchors/:id
 * Get anchor by ID
 */
exports.getById = asyncHandler(async (req, res) => {
    const anchor = await prisma.anchor.findUnique({
        where: { id: req.params.id }
    });

    if (!anchor) {
        return res.status(404).json({ success: false, error: 'Anchor not found' });
    }

    res.json(successResponse(anchor, 'Anchor retrieved'));
});

/**
 * POST /api/anchors
 * Create new anchor
 */
exports.create = asyncHandler(async (req, res) => {
    const { anchor_id, name, local_position, gps_position, is_master } = req.body;

    const anchor = await prisma.anchor.create({
        data: {
            anchor_id,
            name,
            local_position,
            gps_position,
            is_master: is_master || false,
            status: 'offline'
        }
    });

    res.status(201).json(successResponse(anchor, 'Anchor created'));
});

/**
 * PUT /api/anchors/:id
 * Update anchor
 */
exports.update = asyncHandler(async (req, res) => {
    const { name, local_position, gps_position, is_master, status } = req.body;

    const anchor = await prisma.anchor.update({
        where: { id: req.params.id },
        data: {
            name,
            local_position,
            gps_position,
            is_master,
            status
        }
    });

    res.json(successResponse(anchor, 'Anchor updated'));
});

/**
 * DELETE /api/anchors/:id
 * Delete anchor
 */
exports.delete = asyncHandler(async (req, res) => {
    await prisma.anchor.delete({
        where: { id: req.params.id }
    });

    res.json(successResponse(null, 'Anchor deleted'));
});

/**
 * POST /api/anchors/heartbeat
 * Update anchor status from IoT gateway (called by master node)
 * Updates GPS position and online status
 */
exports.heartbeat = asyncHandler(async (req, res) => {
    const { anchor_id, gps_position, local_position, rssi, battery } = req.body;

    if (!anchor_id) {
        return res.status(400).json({ success: false, error: 'anchor_id is required' });
    }

    // Find or create anchor
    let anchor = await prisma.anchor.findUnique({
        where: { anchor_id }
    });

    if (!anchor) {
        // Auto-create anchor if not exists (for new deployments)
        anchor = await prisma.anchor.create({
            data: {
                anchor_id,
                name: `Anchor ${anchor_id}`,
                local_position: local_position || { x: 0, y: 0 },
                gps_position: gps_position || null,
                status: 'online',
                last_heartbeat: new Date()
            }
        });
    } else {
        // Update existing anchor
        const updateData = {
            status: 'online',
            last_heartbeat: new Date()
        };

        if (gps_position) {
            updateData.gps_position = gps_position;
        }
        if (local_position) {
            updateData.local_position = local_position;
        }
        if (rssi !== undefined || battery !== undefined) {
            updateData.stats = { rssi, battery };
        }

        anchor = await prisma.anchor.update({
            where: { anchor_id },
            data: updateData
        });
    }

    // Emit to connected clients via Socket.IO
    const socketService = require('../utils/socketService');
    try {
        const io = socketService.getIO();
        io.emit('anchor:update', {
            id: anchor.id,
            anchor_id: anchor.anchor_id,
            name: anchor.name,
            gps_position: anchor.gps_position,
            local_position: anchor.local_position,
            is_master: anchor.is_master,
            status: anchor.status,
            last_heartbeat: anchor.last_heartbeat
        });
    } catch (err) {
        console.warn('Socket emit error:', err.message);
    }

    res.json(successResponse(anchor, 'Heartbeat received'));
});

/**
 * GET /api/anchors/masters
 * Get only master nodes
 */
exports.getMasters = asyncHandler(async (req, res) => {
    const masters = await prisma.anchor.findMany({
        where: { is_master: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(successResponse(masters, 'Master nodes retrieved'));
});
