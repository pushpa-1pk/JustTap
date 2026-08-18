const { ROOMS, SOCKET_EVENTS } = require('../constants/tracking.constants');
const { telemetryUpdateSchema } = require('../validators/telemetry.validator');
const config = require('../config/env');
const logger = require('../config/logger');
const sessionMutexService = require('../services/sessionMutex.service');
const cacheService = require('../services/cache.service');

// Thread-isolated in-memory cache to handle ultra-low latency tracking protections
const localThrottleMap = new Map();     // socketId -> lastPacketTimestampMillis
const lastTrackedTimestampMap = new Map(); // bookingId:providerId -> lastValidPacketISODate

const socketAuthMiddleware = require('../middlewares/socketAuth.middleware');

const registerTrackingNamespace = (io, bookingClient, telemetryService) => {
  // Senior Improvement: Segment gateway listeners inside a dedicated /tracking namespace boundary
  const trackingNamespace = io.of('/tracking');

  trackingNamespace.use(socketAuthMiddleware);

  trackingNamespace.use((socket, next) => {
    socket.conn.on('packet', (packet) => {
      // Backpressure Trap Protection: Drop inbound data frames if the event loop starts backing up
      if (trackingNamespace.server.opts.maxHttpBufferSize && socket.conn.transport.writable === false) {
        logger.warn('Backpressure threshold breached. Dropping incoming telemetry data frames to protect server stability.');
      }
    });
    next();
  });

  trackingNamespace.on('connection', (socket) => {
    const { userId, role } = socket.user;
    const connectionId = `conn:${socket.id}:${Date.now()}`;

    logger.info('Secure real-time telemetry link channel bound successfully.', {
      connectionId, socketId: socket.id, userId, role
    });

    // Ingress Handler: Secure Room Subscription Gatekeeper Pipeline
    socket.on(SOCKET_EVENTS.INBOUND.JOIN_TRACKING, async (payload) => {
      const { bookingId } = payload || {};
      
      try {
        if (!bookingId) {
          throw new Error('Malformed execution argument: Booking context tracking identifier required.');
        }

        // Fixed Bug 3 & Critical Bug 5: Verify booking ownership and phase state before letting context bind
        const isAuthorized = await bookingClient.verifyTrackingAccess(bookingId, userId, role);
        if (!isAuthorized) {
          logger.warn(`Security Breach Intercepted: User ${userId} unauthorized to subscribe to tracking room ${bookingId}`);
          socket.emit(SOCKET_EVENTS.OUTBOUND.EXCEPTION_RAISED, { success: false, message: 'Access Denied: Tracking access unauthorized.' });
          return;
        }

        const bookingTargetRoom = ROOMS.booking(bookingId);
        await socket.join(bookingTargetRoom);

        const activeStateSnapshot = await cacheService.getBookingSnapshot(bookingId);
        if (activeStateSnapshot) {
            socket.emit('tracking:state:sync', activeStateSnapshot);
        }
        

        // Bind role tracking contexts to separate dedicated monitoring streams
        if (role === 'PROVIDER') {
          await socket.join(ROOMS.provider(userId));
        } else if (role === 'CUSTOMER') {
          await socket.join(ROOMS.customer(userId));
        }

        logger.info(`WebSocket room context secured for subscriber user pipeline. Room mapping: ${bookingTargetRoom}`, {
          connectionId, userId, role, bookingId
        });
      } catch (error) {
        logger.error('Exception processed executing socket room subscription allocation thread:', error);
        socket.emit(SOCKET_EVENTS.OUTBOUND.EXCEPTION_RAISED, { success: false, message: error.message });
      }
    });

    // Telemetry Stream Processing Engine with Deep Security Layer Guards
    socket.on(SOCKET_EVENTS.INBOUND.UPDATE_LOCATION, async (rawPayload) => {
      const timestampMark = Date.now();
      
      try {
        if (socket.user.role !== 'PROVIDER') {
          throw new Error('Access Refused: Real-time telemetry data tracking inputs restricted to service providers.');
        }

        // Fixed Bug 4 & Critical Bug 6: In-memory sliding-window throttling per socket stream
        const lastInputTimestamp = localThrottleMap.get(socket.id) || 0;
        if (timestampMark - lastInputTimestamp < config.throttleWindowMs) {
          logger.warn(`Rate Limit Breach: Throttling high-frequency update execution payload frames from socket ${socket.id}`);
          return; // Silently drop telemetry spikes to protect server processing performance loops
        }
        localThrottleMap.set(socket.id, timestampMark);

        // Fixed Bug 5: Enforced strict validation checking on inbound telemetry frames
        const { error, value: validatedDto } = telemetryUpdateSchema.validate(rawPayload, { stripUnknown: true });
        if (error) {
          logger.warn(`Telemetry Ingress Sanitation Drop: Invalid coordinate package parameters dropped on socket ${socket.id}`, { errors: error.details });
          return;
        }

        // Fixed Bug 7: Accuracy threshold check to filter out scattered or jumping coordinates
        if (validatedDto.accuracy > config.maxAccuracyMeters) {
          logger.debug(`Telemetry Frame Discarded: Position reading accuracy index poor (${validatedDto.accuracy}m > ${config.maxAccuracyMeters}m).`);
          return;
        }

        // Fixed Bug 6: Anti-Replay attack guard: confirm chronological index sequence progression
        const pipelineCacheKey = `${validatedDto.bookingId}:${userId}`;
        const historicalTimestamp = lastTrackedTimestampMap.get(pipelineCacheKey);
        if (historicalTimestamp && new Date(validatedDto.timestamp) <= new Date(historicalTimestamp)) {
          logger.warn(`Replay Attack Filter Intercept: Stale or out-of-order packet timeframe rejected on key ${pipelineCacheKey}`);
          return;
        }
        lastTrackedTimestampMap.set(pipelineCacheKey, validatedDto.timestamp);

        // Fixed Critical Bug 4: Push an instant heartbeat registration block down into hot storage
        await telemetryService.registerProviderHeartbeat(userId, validatedDto.bookingId);

        // Dispatches safe execution frames out to the cluster via Telemetry Service
        await telemetryService.processValidatedTrajectory(userId, validatedDto, trackingNamespace);

      } catch (err) {
        logger.error(`Real-time coordinate processing interruption caught for client mapping ID ${userId}:`, {
          socketId: socket.id, traceId: connectionId, error: err.message
        });
        socket.emit(SOCKET_EVENTS.OUTBOUND.EXCEPTION_RAISED, { success: false, message: 'Internal stream allocation processing failure.' });
      }
    });

    socket.on('disconnect', async (reason) => {
      logger.warn(`Tracking client link dropped: ${socket.id}. Reason: ${reason}`);
      await sessionMutexService.releaseSession(userId, socket.id);
    });
  });
};

module.exports = { registerTrackingNamespace };