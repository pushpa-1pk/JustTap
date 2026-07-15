const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

class SessionMutexService {
  constructor() {
    this.sessionKeyPrefix = 'tracking:session:mutex:';
    this.leaseTtlSeconds = 7200; // 2-hour active lifecycle threshold matching journey profiles
  }

  /**
   * Asserts exclusive control over an active user tracking connection session
   * @param {string} userId 
   * @param {string} socketId 
   * @returns {Promise<string|null>} Returns the previous socket ID if a duplicate connection session is active
   */
  async acquireExclusiveSession(userId, socketId) {
    const key = `${this.sessionKeyPrefix}${userId}`;
    
    try {
      // Fetch any active connection session mapping tracked in the system
      const existingActiveSocketId = await redisClient.get(key);

      if (existingActiveSocketId && existingActiveSocketId !== socketId) {
        // Enforce update metrics atomically inside the primary keyspace index
        await redisClient.set(key, socketId, { EX: this.leaseTtlSeconds });
        return existingActiveSocketId;
      }

      await redisClient.set(key, socketId, { EX: this.leaseTtlSeconds });
      return null;
    } catch (error) {
      logger.error('Failed to run atomicity check rules on user tracking sessions:', { userId, error: error.message });
      return null;
    }
  }

  async releaseSession(userId, socketId) {
    const key = `${this.sessionKeyPrefix}${userId}`;
    try {
      const activeSocketId = await redisClient.get(key);
      if (activeSocketId === socketId) {
        await redisClient.del(key);
      }
    } catch (error) {
      logger.error('Failed to clear user socket tracking indicators cleanly out of memory cache:', { userId, error: error.message });
    }
  }
}

module.exports = new SessionMutexService();