const app = require("./app");
const env = require("./config/env");
const logger = require("./services/logger.service");
const { connectDB, disconnectDB } = require("./config/database");
const { disconnectRedis } = require("./config/redis");

let httpServer;
let shuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    httpServer = app.listen(env.PORT, () => {
      logger.info("AUTH_SERVICE_STARTED", {
        environment: env.NODE_ENV,
        port: env.PORT,
      });
    });
  } catch (error) {
    logger.error("SERVER_STARTUP_FAILED", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.warn("AUTH_SERVICE_SHUTDOWN_STARTED", {
    signal,
  });

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await Promise.allSettled([disconnectDB(), disconnectRedis()]);
    logger.info("AUTH_SERVICE_SHUTDOWN_COMPLETED");
    process.exit(0);
  } catch (error) {
    logger.error("AUTH_SERVICE_SHUTDOWN_FAILED", {
      error: error.message,
    });
    process.exit(1);
  }
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal);
  });
});

process.on("unhandledRejection", (error) => {
  logger.error("UNHANDLED_REJECTION", {
    error: error.message,
    stack: error.stack,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("UNCAUGHT_EXCEPTION", {
    error: error.message,
    stack: error.stack,
  });
  shutdown("uncaughtException");
});

startServer();
