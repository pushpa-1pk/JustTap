const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = require('./app');
const config = require('./config/env');
const { connectRedis, redisClient, redisSubClient } = require('./config/redis');
const { connectDatabase } = require('./config/database');
const logger = require('./config/logger');

const BookingClient = require('./services/clients/booking.client');
const notificationPublisher = require('./services/notificationPublisher.service');
const { registerTrackingNamespace } = require('./sockets/tracking.namespace');
const LocationRepository = require('./repositories/location.repository');
const TelemetryService = require('./services/telemetry.service');
const bookingLifecycleWorker = require('./workers/bookingLifecycle.worker');
const heartbeatMonitorWorker = require('./workers/heartbeatMonitor.worker');

const server = http.createServer(app);

// Primary WebSocket Orchestration Cluster Node Bootstrap Phase
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins.length ? config.allowedOrigins : true,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: 30000,
  pingInterval: 10000
});

const startServer = async () => {
  try {
    await connectRedis();
    await connectDatabase();

    const bookingClient = new BookingClient();
    const locationRepository = new LocationRepository();
    const telemetryService = new TelemetryService(locationRepository, bookingClient);

    io.adapter(createAdapter(redisClient, redisSubClient));
    registerTrackingNamespace(io, bookingClient, telemetryService);

    bookingLifecycleWorker.start().catch((err) => {
      logger.error('Fatal tracking-service subsystem background daemon loop crash:', err);
    });

    // Spin up the background zombie checking monitor loop
    heartbeatMonitorWorker.start(io.of('/tracking')).catch((err) => {
      logger.error('Fatal crash on background zombie session tracking worker thread:', err);
    });

    server.listen(config.port, () => {
      logger.info(`================================================================`);
      logger.info(` JustTap Production Gated Tracking Pipeline Online               `);
      logger.info(` Network Port Routing Gateway: ${config.port}                    `);
      logger.info(` Execution Target Environment Strategy: ${config.env}            `);
      logger.info(`================================================================`);
    });
  } catch (error) {
    logger.error('Fatal tracking-service subsystem orchestration bootstrapping sequence collapse:', error);
    process.exit(1);
  }
};

// Fixed Critical Bug 3: Robust Graceful Disconnection Teardown Sequence to eliminate memory starvation leaks
const initiateSystemGracefulTeardown = async (signal) => {
  logger.warn(`Operational Teardown Signal [${signal}] intercepted. Halting microservice processing lanes...`);
  
  // 1. Establish an emergency cutoff safety timer circuit boundary
  const safetyTimeoutForceTrigger = setTimeout(() => {
    logger.error('Teardown exceeded connection close budget threshold limit. Forcing termination.');
    process.exit(1);
  }, 10000);

  try {
    // 2. Clear namespace socket descriptors, closing pipeline access routes securely
    io.of('/tracking').disconnectSockets(true);
    await io.close();
    logger.info('Stateless ingress WebSocket connection lanes completely flushed.');

    // 3. Halt underlying network listener server
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP infrastructure network gateway connection mapping closed.');

    // 4. Safely clean downstream storage proxies
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    logger.info('Mongoose database connection pool split gracefully.');

    await Promise.all([
      redisClient.quit(),
      redisSubClient.quit()
    ]);
    logger.info('Redis cluster command interface blocks unmapped successfully.');
    await notificationPublisher.disconnect();

    clearTimeout(safetyTimeoutForceTrigger);
    logger.info('System infrastructure shutdown sequence concluded seamlessly without anomalies.');
    process.exit(0);
  } catch (error) {
    logger.error('Graceful shutdown loop generated execution tracking anomalies:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => initiateSystemGracefulTeardown('SIGTERM'));
process.on('SIGINT', () => initiateSystemGracefulTeardown('SIGINT'));

startServer();
