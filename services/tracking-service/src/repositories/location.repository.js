const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

class LocationRepository {
  constructor() {
    // Isolated key prefix namespaces
    this.hashPrefix = 'tracking:provider:';
    this.geoIndexKey = 'tracking:spatial:index';
    this.ttlSeconds = 60; 
  }

  /**
   * Commits high-frequency telemetry updates into an optimal memory-hot Redis Hash structure
   */
  async saveLatestLocation(providerId, locationDto) {
    const key = `${this.hashPrefix}${providerId}`;
    
    // Flatten fields explicitly into primitive string values for compatibility with Redis hashes
    const hashPayload = {
      bookingId: locationDto.bookingId.toString(),
      latitude: locationDto.latitude.toString(),
      longitude: locationDto.longitude.toString(),
      accuracy: locationDto.accuracy.toString(),
      speed: locationDto.speed.toString(),
      heading: locationDto.heading.toString(),
      timestamp: new Date(locationDto.timestamp).toISOString(),
      lastSeenTimestamp: Date.now().toString()
    };

    try {
      const pipeline = redisClient.multi();
      
      // Update the descriptive telemetry hash profile
      pipeline.hSet(key, hashPayload);
      pipeline.expire(key, this.ttlSeconds);
      
      // Index location indexes into the shared Geospatial Indexing array
      pipeline.geoAdd(this.geoIndexKey, {
        longitude: parseFloat(locationDto.longitude),
        latitude: parseFloat(locationDto.latitude),
        member: providerId
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Low-level cluster exception writing provider telemetry payload to Redis:', { providerId, error: error.message });
      throw error;
    }
  }

  /**
   * Retrieves full descriptive coordinate snapshots out of a provider's Redis hash profile
   */
  async getLatestLocation(providerId) {
    const key = `${this.hashPrefix}${providerId}`;
    try {
      const data = await redisClient.hGetAll(key);
      if (!data || Object.keys(data).length === 0) return null;

      return {
        bookingId: data.bookingId,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        accuracy: parseFloat(data.accuracy),
        speed: parseFloat(data.speed),
        heading: parseFloat(data.heading),
        timestamp: new Date(data.timestamp),
        lastSeenTimestamp: parseInt(data.lastSeenTimestamp, 10)
      };
    } catch (error) {
      logger.error('Low-level database read failure extracting tracking hash metadata metrics:', { providerId, error: error.message });
      throw error;
    }
  }

  /**
   * Refreshes the active provider lifetime counter to sustain active tracking loops
   */
  async updateHeartbeat(providerId) {
    const key = `${this.hashPrefix}${providerId}`;
    try {
      const pipeline = redisClient.multi();
      pipeline.hSet(key, 'lastSeenTimestamp', Date.now().toString());
      pipeline.expire(key, this.ttlSeconds);
      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to refresh volatile lifecycle counters inside engine keyspaces:', { providerId, error: error.message });
      throw error;
    }
  }

  /**
   * Evicts spatial footprints cleanly out of indexes when a provider disconnects
   */
  async deleteLocation(providerId) {
    const key = `${this.hashPrefix}${providerId}`;
    try {
      const pipeline = redisClient.multi();
      pipeline.del(key);
      pipeline.zRem(this.geoIndexKey, providerId);
      await pipeline.exec();
    } catch (error) {
      logger.error('Low-level index eviction execution failure context details:', { providerId, error: error.message });
      throw error;
    }
  }
}

module.exports = LocationRepository;