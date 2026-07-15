const { createClient } = require('redis');
const config = require('./env');
const logger = require('./logger');

const maxRetryStrategy = (retries, cause) => {
  // Enforce a hard cap on continuous connection retry attempts to avoid memory starvation
  if (retries > 20) {
    logger.error('Critical Failover Collapse: Redis connection retry limit reached. Halting thread.', { retries });
    return new Error('Redis connection attempts completely exhausted.');
  }
  const calculateDelayMs = Math.min(retries * 500, 4000);
  logger.warn(`Infrastructure backplane connection interrupted. Retrying link channel allocation...`, { retries, calculateDelayMs, cause: cause?.message });
  return calculateDelayMs;
};
const redisClient = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: maxRetryStrategy,
    connectTimeout: 5000
  }
});
const redisSubClient = redisClient.duplicate();

redisClient.on('connect', () => logger.info('System Master Redis connection stream active.'));
redisClient.on('error', (err) => logger.error('Master Redis connection Exception:', err));

redisSubClient.on('connect', () => logger.info('System Subscription Redis connection stream active.'));
redisSubClient.on('error', (err) => logger.error('Subscription Redis connection Exception:', err));

const connectRedis = async () => {
  try {
    await Promise.all([
      redisClient.connect(),
      redisSubClient.connect()
    ]);
  } catch (error) {
    logger.error('Failed to bind container to Redis cluster nodes sequentially:', error);
    // Throw error up to let orchestration tier recycle the stateless container pod naturally
    throw error;
  }
};

module.exports = {
  redisClient,
  redisSubClient,
  connectRedis
};