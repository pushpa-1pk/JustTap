const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDatabase = require('./config/database');
const { connectRedis } = require('./config/redis');
const { startBackgroundProcessing } = require('./jobs');

let server;

const startServer = async () => {
  // 1. Establish State Persistence Dependencies
  await connectDatabase();
  await connectRedis();

  // 2. Bind Active Process Port
  server = app.listen(env.port, () => {
    logger.info(`Booking Microservice initialized successfully`, {
      port: env.port,
      environment: env.nodeEnv
    });
  });

  startBackgroundProcessing();
};

// Handle unhandled asynchronous rejections safely
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION DETECTED. Initiating graceful shutdown...', {
    message: err.message,
    stack: err.stack
  });
  
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

startServer();
