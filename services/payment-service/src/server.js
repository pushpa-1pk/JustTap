const app = require("./app");
const env = require("./config/env");
const { logger } = require("./config/logger");
const { connectDatabase, disconnectDatabase, checkDatabaseHealth } = require("./config/database");
const { connectRedis, disconnectRedis, checkRedisHealth } = require("./config/redis");
const errorMiddleware = require("./middlewares/error.middleware");
const OutboxPoller = require("./jobs/outboxPoller");
const backgroundReconciliationScheduler = require("./jobs/reconciliation");
const rabbitMqBroker = require("./events/rabbitmqBroker");

const outboxWorker = new OutboxPoller(rabbitMqBroker);
let server;

app.get("/live", (req, res) => {
  return res.status(200).json({ status: "ALIVE", timestamp: new Date().toISOString() });
});

app.get("/ready", async (req, res) => {
  const isMongoHealthy = checkDatabaseHealth();
  const isRedisHealthy = await checkRedisHealth();
  const isSystemReady = isMongoHealthy && isRedisHealthy;

  return res.status(isSystemReady ? 200 : 503).json({
    status: isSystemReady ? "READY" : "NOT_READY",
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: isMongoHealthy ? "HEALTHY" : "UNHEALTHY",
      redis: isRedisHealthy ? "HEALTHY" : "UNHEALTHY"
    }
  });
});

app.get("/health", async (req, res) => {
  const isMongoHealthy = checkDatabaseHealth();
  const isRedisHealthy = await checkRedisHealth();
  const isUp = isMongoHealthy && isRedisHealthy;

  return res.status(isUp ? 200 : 503).json({
    status: isUp ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: isMongoHealthy ? "HEALTHY" : "UNHEALTHY",
      redis: isRedisHealthy ? "HEALTHY" : "UNHEALTHY"
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

app.use(errorMiddleware);

const startServer = async () => {
  try {
    logger.info("Assembling target financial microservice ecosystem under src/ context...");
    await connectDatabase();
    await connectRedis();

    server = app.listen(env.port, () => {
      logger.info(`Payment Service initialized successfully on port: ${env.port}`);
    });

    outboxWorker.start().catch((error) => {
      logger.error("Outbox worker crashed", { error });
    });
    backgroundReconciliationScheduler.start();
  } catch (error) {
    logger.error("Fatal exception occurred during initialization routing sequence", { error });
    process.exit(1);
  }
};

const shutdownGracefully = async (signal) => {
  logger.warn(`Signal ${signal} captured. Initializing graceful termination sequence.`);

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    try {
      outboxWorker.stop();
      backgroundReconciliationScheduler.stop();
      await rabbitMqBroker.disconnect();
      await disconnectDatabase();
      await disconnectRedis();
      process.exit(0);
    } catch (error) {
      logger.error("Error occurred during resource pool closure sequence", { error });
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));
process.on("SIGINT", () => shutdownGracefully("SIGINT"));

module.exports = { app, startServer };

if (require.main === module) {
  startServer();
}
