const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

class PresenceService {
  constructor() {
    this.presenceZSetKey = 'tracking:providers:presence';
    this.providerMetaPrefix = 'tracking:provider:meta:';
    this.gracePeriodTtlSeconds = 30; // 30-second window to recover from network drops
  }

  /**
   * Records a provider's connection heartbeat by stamping the current timestamp onto a Redis ZSET
   */
  async recordHeartbeat(providerId, currentBookingId) {
    const timestampMark = Date.now();
    const metaKey = `${this.providerMetaPrefix}${providerId}`;

    try {
      const pipeline = redisClient.multi();
      
      // Index the provider ID inside our sorted set using the timestamp as the sort score
      pipeline.zAdd(this.presenceZSetKey, { score: timestampMark, value: providerId });
      
      // Store current operational metadata needed for out-of-line session cleanups
      pipeline.hSet(metaKey, {
        bookingId: currentBookingId || 'NONE',
        lastActive: timestampMark.toString()
      });
      pipeline.expire(metaKey, 86400); // 24-hour cleanup fallback window

      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to update provider heartbeat inside ZSET tracking index:', { providerId, error: error.message });
      throw error;
    }
  }

  /**
   * Puts a disconnected provider into a temporary grace period window to prevent status alert spamming
   */
  async handleProviderTemporaryDisconnect(providerId) {
    const metaKey = `${this.providerMetaPrefix}${providerId}`;
    try {
      // Keep the ZSET score intact but flag the meta profile as disconnected to start the grace period timer
      await redisClient.hSet(metaKey, 'connectionState', 'DISCONNECTED');
      logger.info(`Provider ${providerId} entered a network recovery grace period window.`);
    } catch (error) {
      logger.error('Failed to initiate session disconnection recovery grace period locks:', { providerId, error: error.message });
    }
  }

  /**
   * Explicitly clears out a provider's active presence tracking parameters from the system
   */
  async clearPresenceLogs(providerId) {
    try {
      const pipeline = redisClient.multi();
      pipeline.zRem(this.presenceZSetKey, providerId);
      pipeline.del(`${this.providerMetaPrefix}${providerId}`);
      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to clear presence indicators out of hot storage partitions:', { providerId, error: error.message });
    }
  }
}

module.exports = new PresenceService();