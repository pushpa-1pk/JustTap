const amqp = require('amqplib');
const { randomUUID } = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');

class NotificationPublisherService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connectPromise = null;
  }

  async connect() {
    if (this.channel) {
      return this.channel;
    }

    if (!this.connectPromise) {
      this.connectPromise = this._connectInternal().finally(() => {
        this.connectPromise = null;
      });
    }

    return this.connectPromise;
  }

  async _connectInternal() {
    this.connection = await amqp.connect(config.rabbitmqUri);
    this.connection.on('error', (error) => {
      logger.error('RabbitMQ connection error in tracking-service', { message: error.message });
    });
    this.connection.on('close', () => {
      logger.warn('RabbitMQ connection closed in tracking-service. Resetting publisher channel.');
      this.connection = null;
      this.channel = null;
    });

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(config.rabbitmqExchange, 'topic', { durable: true });
    return this.channel;
  }

  async publishArrival(payload) {
    if (!payload?.customerId) {
      logger.warn('Skipping tracking arrival notification because customerId is missing.');
      return false;
    }

    const body = {
      eventId: randomUUID(),
      userId: String(payload.customerId),
      timestamp: new Date().toISOString(),
      payload: {
        bookingId: payload.bookingId,
        providerId: payload.providerId || null,
        providerName: payload.providerName || payload.providerSnapshot?.businessName || null,
        providerSnapshot: payload.providerSnapshot || null,
        distanceMeters: payload.distanceMeters ?? null
      }
    };

    const channel = await this.connect();
    channel.publish(
      config.rabbitmqExchange,
      'tracking.arrived',
      Buffer.from(JSON.stringify(body)),
      {
        contentType: 'application/json',
        persistent: true,
        messageId: body.eventId,
        timestamp: Date.now(),
        type: 'tracking.arrived'
      }
    );

    return true;
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.close().catch(() => {});
    }
    if (this.connection) {
      await this.connection.close().catch(() => {});
    }
    this.channel = null;
    this.connection = null;
  }
}

module.exports = new NotificationPublisherService();
