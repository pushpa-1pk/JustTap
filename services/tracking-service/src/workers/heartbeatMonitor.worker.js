const { redisClient } = require('../config/redis');
const presenceService = require('../services/presence.service');
const eventBusService = require('../services/eventBus.service');
const logger = require('../config/logger');

class HeartbeatMonitorWorker {
  constructor() {
    this.presenceZSetKey = 'tracking:providers:presence';
    this.providerMetaPrefix = 'tracking:provider:meta:';
    this.timeoutThresholdMs = 20000; // Providers are marked dead if silent for over 20 seconds
    this.checkIntervalMs = 5000;     // Run the ZSET scanning query every 5 seconds
    this.isRunning = false;
  }

  async start(namespaceInstance) {
    this.isRunning = true;
    logger.info('Zombie session monitoring daemon started running successfully.');

    while (this.isRunning) {
      try {
        await this.evictZombieProviders(namespaceInstance);
      } catch (error) {
        logger.error('Zombie monitoring loop encountered a processing exception:', error);
      }
      await new Promise(resolve => setTimeout(resolve, this.checkIntervalMs));
    }
  }

  async evictZombieProviders(namespaceInstance) {
    const absoluteCutoffTime = Date.now() - this.timeoutThresholdMs;

    try {
      // Extract all provider IDs whose latest heartbeat timestamp score falls below our cutoff limits
      const expiredProviderIds = await redisClient.zRangeByScore(
        this.presenceZSetKey,
        '-inf',
        absoluteCutoffTime
      );

      if (!expiredProviderIds || expiredProviderIds.length === 0) return;

      logger.warn(`Zombie monitoring engine identified (${expiredProviderIds.length}) dead provider connections. Commencing cleanups...`);

      for (const providerId of expiredProviderIds) {
        const metaKey = `${this.providerMetaPrefix}${providerId}`;
        const metadata = await redisClient.hGetAll(metaKey);

        // 1. Clear out memory tracking parameters to free up space
        await presenceService.clearPresenceLogs(providerId);

        if (metadata && metadata.bookingId !== 'NONE') {
          // 2. Broadcast a connection dropout alert down the specific live booking room lane
          namespaceInstance.to(`room:booking:${metadata.bookingId}`).emit('provider:presence:changed', {
            providerId,
            status: 'OFFLINE',
            timestamp: new Date().toISOString()
          });

          // 3. Publish an offline cleanup command onto our event stream bus for other microservices to process
          await eventBusService.publish('tracking:provider:offline', {
            bookingId: metadata.bookingId,
            providerId,
            reason: 'HEARTBEAT_TIMEOUT'
          });
        }
      }
    } catch (error) {
      logger.error('Failed to complete zombie provider eviction routines successfully:', error);
    }
  }

  async stop() {
    logger.warn('Halting background zombie heartbeat monitoring worker loop thread...');
    this.isRunning = false;
  }
}

module.exports = new HeartbeatMonitorWorker();