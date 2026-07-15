const { redisClient } = require('../config/redis');
const config = require('../config/env');
const logger = require('../config/logger');

class EventBusService {
  constructor() {
    this.streamName = config.trackingStreamName;
  }

  /**
   * Appends an immutable tracking telemetry change record to the distributed stream log
   */
  async publish(eventType, payload) {
    try {
      // Redis Streams require flat string flat dictionary values
      const transformedFields = [
        'eventType', eventType,
        'bookingId', payload.bookingId.toString(),
        'timestamp', new Date().toISOString(),
        'metadata', JSON.stringify(payload)
      ];

      // Atomic append operation into the distributed streaming log array
      const messageId = await redisClient.xAdd(this.streamName, '*', transformedFields);
      
      logger.info(`Successfully appended event [${eventType}] to Redis stream architecture log`, {
        messageId, eventType, bookingId: payload.bookingId
      });
      return messageId;
    } catch (error) {
      logger.error('Failed to append tracking status record entry to message stream log architecture:', error);
      throw error;
    }
  }
}

module.exports = new EventBusService();