const { redisClient } = require("../config/redis");

class RedisService {
  async set(key, value, ttl = null) {
    if (ttl) {
      return redisClient.set(key, value, "EX", ttl);
    }

    return redisClient.set(key, value);
  }

  async get(key) {
    return redisClient.get(key);
  }

  async delete(key) {
    return redisClient.del(key);
  }

  async exists(key) {
    const exists = await redisClient.exists(key);
    return exists === 1;
  }

  async expire(key, seconds) {
    return redisClient.expire(key, seconds);
  }

  async increment(key) {
    return redisClient.incr(key);
  }

  async incrementWithExpiry(key, ttl) {
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, ttl);
    }

    return count;
  }

  async getNumber(key) {
    const value = await redisClient.get(key);
    return value ? Number(value) : 0;
  }
}

module.exports = new RedisService();
