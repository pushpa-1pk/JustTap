const Redis = require("ioredis");
const env = require("./env");
const logger = require("../services/logger.service");

const redisClient = new Redis(env.REDIS_URL);

redisClient.on("connect", () => {
  logger.info("REDIS_CONNECTED");
});

redisClient.on("error", (err) => {
  logger.error("REDIS_ERROR", {
    error: err.message,
  });
});

const pingRedis = async () => redisClient.ping();

const disconnectRedis = async () => {
  await redisClient.quit();
  logger.info("REDIS_DISCONNECTED");
};

const getRedisHealth = async () => {
  const pong = await pingRedis();

  return {
    status: pong === "PONG" ? "up" : "degraded",
  };
};

module.exports = {
  redisClient,
  pingRedis,
  disconnectRedis,
  getRedisHealth,
};
