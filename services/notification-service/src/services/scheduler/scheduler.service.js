const redis = require('../../config/redis');
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../config/logger');

class SchedulerService {
  async scheduleDelayedNotification(jobId, executionTimestamp, taskPayload) {
    const delayMs = executionTimestamp - Date.now();
    
    if (delayMs <= 0) {
      return this.dispatchImmediate(taskPayload);
    }

    const storageKey = `notification:schedule:${jobId}`;
    await redis.set(storageKey, JSON.stringify(taskPayload), 'PX', delayMs);
    
    // Utilize ZSET index pointer references for dynamic time-bounds tracking sorting
    await redis.zadd('notification:scheduler:zset', executionTimestamp, jobId);
    logger.info(`Delayed notification job registered in cache store matrix: ${jobId}`);
  }

  async processPollerTicks() {
    const now = Date.now();
    const targetJobIds = await redis.zrangebyscore('notification:scheduler:zset', 0, now);
    
    if (!targetJobIds || targetJobIds.length === 0) return;

    const mqChannel = getChannel();

    for (const id of targetJobIds) {
      const cacheData = await redis.get(`notification:schedule:${id}`);
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        mqChannel.sendToQueue(
          'notification.ingress.events',
          Buffer.from(JSON.stringify(parsed)),
          { deliveryMode: 2 }
        );

        await redis.del(`notification:schedule:${id}`);
      }
      await redis.zrem('notification:scheduler:zset', id);
    }
  }

  dispatchImmediate(payload) {
    const mqChannel = getChannel();
    mqChannel.sendToQueue(
      'notification.ingress.events',
      Buffer.from(JSON.stringify(payload)),
      { deliveryMode: 2 }
    );
  }
}

module.exports = new SchedulerService();