const { createClient } = require("redis");
const env = require("./env");
const { logger } = require("./logger");

let isRedisConnected = false;

const redisClient = createClient({
  url: env.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      // Prevents the thundering herd problem using explicit exponential backoff plus randomized jitter
      const exponentialDelay = Math.min(retries * 100, 3000);
      const randomJitter = Math.random() * 150; 
      const totalDelay = exponentialDelay + randomJitter;
      
      logger.warn(`Redis adapter connection lost. Retrying in ${Math.round(totalDelay)}ms (Attempt ${retries})`);
      return totalDelay;
    }
  }
});

redisClient.on("connect", () => { logger.info("Redis socket stream initiated"); });
redisClient.on("ready", () => { isRedisConnected = true; logger.info("Redis instance ready for command pipeline transmission"); });
redisClient.on("reconnecting", () => { isRedisConnected = false; logger.warn("Redis client executing a reconnection loop"); });
redisClient.on("end", () => { isRedisConnected = false; logger.warn("Redis socket connection has ended cleanly"); });
redisClient.on("error", (error) => { isRedisConnected = false; logger.error("Redis system cluster runtime failure", { error }); });

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error("Failed to safely mount target Redis instance", { error });
    throw error;
  }
};

const disconnectRedis = async () => {
  logger.info("Executing safe Redis termination routing...");
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  isRedisConnected = false;
  logger.info("Redis transport connection disconnected gracefully");
};

const checkRedisHealth = async () => {
  if (!isRedisConnected) return false;
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch (error) {
    logger.error("Redis health probe execution failed", { error });
    return false;
  }
};

module.exports = { redisClient, connectRedis, disconnectRedis, checkRedisHealth };