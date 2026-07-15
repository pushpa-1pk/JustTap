const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.prefix = 'tracking:snapshot:';
    this.ttl = 86400; // 24-hour retention safety window
  }

  async cacheBookingSnapshot(bookingId, snapshotData) {
    const key = `${this.prefix}${bookingId}`;
    try {
      await redisClient.hSet(key, {
        lat: snapshotData.latitude.toString(),
        lon: snapshotData.longitude.toString(),
        providerId: snapshotData.providerId.toString(),
        currentState: 'NONE' // Initialize structural state tracking baseline
      });
      await redisClient.expire(key, this.ttl);
    } catch (error) {
      logger.error('Failed to commit warm static coordinate cache to memory store:', { bookingId, error: error.message });
      throw error;
    }
  }

  async getBookingSnapshot(bookingId) {
    const key = `${this.prefix}${bookingId}`;
    try {
      const cache = await redisClient.hGetAll(key);
      if (!cache || Object.keys(cache).length === 0) return null;
      return {
        latitude: parseFloat(cache.lat),
        longitude: parseFloat(cache.lon),
        providerId: cache.providerId,
        currentState: cache.currentState
      };
    } catch (error) {
      logger.error('Failed to read warm spatial position configurations from memory store:', { bookingId, error: error.message });
      return null;
    }
  }

  async updateCachedState(bookingId, nextState) {
    const key = `${this.prefix}${bookingId}`;
    try {
      await redisClient.hSet(key, 'currentState', nextState);
    } catch (error) {
      logger.error('Failed to cycle state position cache entries:', { bookingId, nextState, error: error.message });
    }
  }

  async clearBookingResources(bookingId) {
    try {
      const keysToClear = [
        `${this.prefix}${bookingId}`,
        `tracking:geofence:${bookingId}:lock:nearby`,
        `tracking:geofence:${bookingId}:lock:arrived`
      ];
      await redisClient.del(keysToClear);
      logger.info(`Evicted tracking state allocations and geofence locks for booking ${bookingId}`);
    } catch (error) {
      logger.error('Failed to clear operational tracking resource allocations cleanly:', { bookingId, error: error.message });
    }
  }
}

module.exports = new CacheService();