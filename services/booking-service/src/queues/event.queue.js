const { redisClient } = require('../config/redis');
const notificationPublisher = require('../events/notification.publisher');
const logger = require('../utils/logger');

class EventQueue {
  constructor() {
    this.redisClient = redisClient;
    this.streamKey = 'justtap:booking:events:stream';
    this.groupName = 'justtap:booking:subscribers:group';
    this.groupInitialized = false;
  }

  /**
   * Initializes the Redis Stream Consumer Group idempotently
   */
  async initGroup() {
    if (this.groupInitialized) {
      return;
    }

    try {
      await this.redisClient.sendCommand([
        'XGROUP',
        'CREATE',
        this.streamKey,
        this.groupName,
        '$',
        'MKSTREAM'
      ]);
    } catch (err) {
      if (!err.message.includes('BUSYGROUP')) {
        logger.error({ message: 'Failed to initialize Redis Stream group.', error: err.message });
      }
    }

    this.groupInitialized = true;
  }

  /**
   * Pushes an event into the stream with strict key-value pairs
   */
  async enqueue(eventType, payload) {
    await this.initGroup();

    const data = {
      eventType,
      payload: JSON.stringify(payload),
      emittedAt: new Date().toISOString()
    };

    const streamMessageId = await this.redisClient.sendCommand([
      'XADD',
      this.streamKey,
      '*',
      'data',
      JSON.stringify(data)
    ]);

    try {
      await notificationPublisher.publish(eventType, payload);
    } catch (error) {
      logger.error({
        message: 'Failed to publish booking event to RabbitMQ notification exchange.',
        eventType,
        error: error.message
      });
    }

    return streamMessageId;
  }
}

module.exports = new EventQueue();
