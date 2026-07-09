const app = require("./app");
const env = require("./config/env");
const logger = require("./services/logger.service");
const { connectDB, disconnectDB } = require("./config/database");

let httpServer;
let shuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    httpServer = app.listen(env.PORT, () => {
      logger.info("SERVICE_MANAGEMENT_STARTED", {
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
  logger.warn("SERVICE_MANAGEMENT_SHUTDOWN_STARTED", { signal });

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

    await disconnectDB();
    logger.info("SERVICE_MANAGEMENT_SHUTDOWN_COMPLETED");
    process.exit(0);
  } catch (error) {
    logger.error("SERVICE_MANAGEMENT_SHUTDOWN_FAILED", {
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
