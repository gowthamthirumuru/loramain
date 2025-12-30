/**
 * Server Entry Point
 * Initializes database, socket.io, and starts the HTTP server
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketService = require('./utils/socketService');
const logger = require('./utils/logger');

// =============== STARTUP ===============

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = socketService.init(server);

    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Join room for specific tourist tracking
      socket.on('subscribe_tourist', (touristId) => {
        socket.join(`tourist_${touristId}`);
        logger.info(`Socket ${socket.id} subscribed to tourist ${touristId}`);
      });

      // Join room for all SOS alerts
      socket.on('subscribe_sos', () => {
        socket.join('sos_alerts');
        logger.info(`Socket ${socket.id} subscribed to SOS alerts`);
      });
    });

    // 4. Start Server
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`📡 Socket.IO ready for connections`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // =============== GRACEFUL SHUTDOWN ===============

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close socket connections
      io.close(() => {
        logger.info('Socket.IO closed');
      });

      // Close database connection
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// =============== HANDLE UNCAUGHT ERRORS ===============

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

// Start the server
startServer();