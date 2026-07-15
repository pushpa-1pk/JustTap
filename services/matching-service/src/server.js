const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { connectRedis, disconnectRedis } = require("./config/redis");
const bootstrapBackgroundWorkers = require("./bootstrap/workers");

let server;
let workerHandle;

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    workerHandle = await bootstrapBackgroundWorkers();

    server = app.listen(env.PORT, () => {
      logger.info("matching_service_started", {
        port: env.PORT,
        env: env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error("matching_service_startup_failed", { message: error.message });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.warn("matching_service_shutdown_started", { signal });

  try {
    if (workerHandle?.stop) {
      await workerHandle.stop();
    }

    await new Promise((resolve) => {
      if (!server) {
        resolve();
        return;
      }

      server.close(() => resolve());
    });

    await disconnectRedis();
    await disconnectDatabase();
    logger.info("matching_service_shutdown_complete");
    process.exit(0);
  } catch (error) {
    logger.error("matching_service_shutdown_failed", { message: error.message });
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
