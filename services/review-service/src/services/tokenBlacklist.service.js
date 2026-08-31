const Redis = require("ioredis");
const config = require("../config/env");

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient && config.redis?.url) {
    try {
      redisClient = new Redis(config.redis.url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      redisClient.connect().catch(() => {});
    } catch (e) {
      redisClient = null;
    }
  }
  return redisClient;
};

const isBlacklisted = async (jti) => {
  if (!jti) return false;
  try {
    const client = getRedisClient();
    if (!client) return false;
    const exists = await client.exists(`jwt_blacklist:${jti}`);
    return exists === 1;
  } catch (error) {
    return false;
  }
};

module.exports = { isBlacklisted };
