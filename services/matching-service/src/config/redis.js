const { createClient } = require("redis");
const env = require("./env");
const logger = require("./logger");

const buildClient = (name) => {
  const client = createClient({
    url: env.REDIS_URL,
    database: env.REDIS_DB,
    socket: {
      connectTimeout: env.CLIENT_TIMEOUT_MS,
      keepAlive: true,
      reconnectStrategy: (retries) => Math.min(retries * 100, 2000),
    },
  });

  client.on("error", (error) => {
    logger.error("redis_client_error", { client: name, message: error.message });
  });

  client.on("connect", () => {
    logger.info("redis_client_connected", { client: name });
  });

  return client;
};

const redisClient = buildClient("command");
const redisSubscriber = buildClient("subscriber");

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  if (!redisSubscriber.isOpen) {
    await redisSubscriber.connect();
  }
};

const disconnectRedis = async () => {
  const closers = [];

  if (redisSubscriber.isOpen) {
    closers.push(redisSubscriber.quit().catch(() => redisSubscriber.disconnect()));
  }

  if (redisClient.isOpen) {
    closers.push(redisClient.quit().catch(() => redisClient.disconnect()));
  }

  await Promise.all(closers);
};

module.exports = {
  redisClient,
  redisSubscriber,
  connectRedis,
  disconnectRedis,
};
