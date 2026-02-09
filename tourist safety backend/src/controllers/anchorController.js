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
