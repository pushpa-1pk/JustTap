const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient, redisSubClient } = require('../config/redis');
const socketAuthMiddleware = require('../middlewares/socketAuth.middleware');
const { SOCKET_EVENTS } = require('../constants/tracking.constants');
const logger = require('../config/logger');

// Lazy-loaded handlers to ensure the dependency injection composition root boots cleanly downstream
let telemetryServiceInstance = null;

const initializeSocketBroker = (httpServer, telemetryService) => {
  telemetryServiceInstance = telemetryService;

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket'],
    pingTimeout: 30000,
    pingInterval: 10000
  });

  io.adapter(createAdapter(redisClient, redisSubClient));
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const { userId, role } = socket.user;
    logger.info(`WebSocket established connection connection pod mapping for actor ID: ${userId} [${role}] on socket endpoint ${socket.id}`);

    // Dynamic Multi-Tenant Room Isolation Mapping Channel
    socket.join(`user:identity:${userId}`);

    socket.on(SOCKET_EVENTS.INBOUND.JOIN_TRACKING, async (payload) => {
      try {
        const { bookingId } = payload || {};
        if (!bookingId) throw new Error('Structured target booking tracking reference allocation identifier required.');
        
        const trackingChannelRoom = `room:booking:${bookingId}`;
        await socket.join(trackingChannelRoom);
        
        logger.info(`WebSocket Actor ID ${userId} [${role}] successfully attached connection to tracking channel: ${trackingChannelRoom}`);
      } catch (err) {
        socket.emit(SOCKET_EVENTS.OUTBOUND.EXCEPTION_RAISED, { success: false, message: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.INBOUND.UPDATE_LOCATION, async (payload) => {
      try {
        if (socket.user.role !== 'PROVIDER') {
          throw new Error('Access validation violation: Telemetry tracking data update vectors are restricted to providers.');
        }
        await telemetryServiceInstance.processProviderIncomingTelemetry(socket.user.userId, payload, io);
      } catch (err) {
        logger.error(`WebSocket Location update processing step routing interruption for user ${userId}:`, err);
        socket.emit(SOCKET_EVENTS.OUTBOUND.EXCEPTION_RAISED, { success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket closed connection session teardown finished for client ID: ${userId} on socket ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initializeSocketBroker };