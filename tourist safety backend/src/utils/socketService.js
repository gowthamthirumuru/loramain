/**
 * Socket.IO Service with JWT Authentication
 * Handles real-time communication
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

let io;

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    console.log('[DEBUG] Socket Service Init. IO is:', !!io, typeof io);
    if (io) console.log('[DEBUG] IO keys:', Object.keys(io));
    if (io) console.log('[DEBUG] IO.to type:', typeof io.to);

    // ============================================
    // JWT Authentication Middleware
    // ============================================
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          // Allow unauthenticated connections for public features (location updates from gateways)
          socket.user = null;
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });

        // Remove passwordHash and salt manually if needed, or rely on just not sending it back.
        // Prisma doesn't always strictly need .select() for internal logic unless we broadcast it.
        // For safety, let's keep it clean if we attach to socket.

        if (user) {
          delete user.passwordHash;
          delete user.salt;
        }

        if (!user || user.status !== 'active') {
          return next(new Error('User not found or inactive'));
        }

        socket.user = user;
        next();
      } catch (error) {
        // Allow connection but mark as unauthenticated
        socket.user = null;
        next();
      }
    });

    // ============================================
    // Connection Handling
    // ============================================
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}${socket.user ? ` (User: ${socket.user.email})` : ' (Anonymous)'}`);

      // Join user-specific room if authenticated
      if (socket.user) {
        socket.join(`user:${socket.user._id}`);
        socket.join(`role:${socket.user.role}`);
      }

      // ============================================
      // Room Subscriptions
      // ============================================

      // Subscribe to zone updates
      socket.on('subscribe_zone', (zoneId) => {
        socket.join(`zone:${zoneId}`);
        console.log(`Socket ${socket.id} subscribed to zone:${zoneId}`);
      });

      socket.on('unsubscribe_zone', (zoneId) => {
        socket.leave(`zone:${zoneId}`);
      });

      // Subscribe to team updates
      socket.on('subscribe_team', (teamId) => {
        socket.join(`team:${teamId}`);
        console.log(`Socket ${socket.id} subscribed to team:${teamId}`);
      });

      // Subscribe to SOS alerts (all alerts)
      socket.on('subscribe_sos', () => {
        socket.join('sos_alerts');
        console.log(`Socket ${socket.id} subscribed to SOS alerts`);
      });

      // Subscribe to tourist tracking
      socket.on('subscribe_tourist', (touristId) => {
        socket.join(`tourist:${touristId}`);
      });

      // ============================================
      // Heartbeat / Ping-Pong
      // ============================================
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // ============================================
      // Disconnect
      // ============================================
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id} - ${reason}`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  // ============================================
  // Emit Helpers
  // ============================================

  emitToUser: (userId, event, data) => {
    console.log('[DEBUG] emitToUser called', { userId, event, ioExists: !!io });
    if (io) {
      console.log('[DEBUG] io.to is', typeof io.to);
      io.to(`user:${userId}`).emit(event, data);
    }
  },

  emitToRole: (role, event, data) => {
    if (io) io.to(`role:${role}`).emit(event, data);
  },

  emitToZone: (zoneId, event, data) => {
    if (io) io.to(`zone:${zoneId}`).emit(event, data);
  },

  emitToTeam: (teamId, event, data) => {
    if (io) io.to(`team:${teamId}`).emit(event, data);
  },

  emitSOSAlert: (alertData) => {
    if (io) io.emit('sos_alert', alertData);
  },

  broadcast: (event, data) => {
    if (io) io.emit(event, data);
  }
};