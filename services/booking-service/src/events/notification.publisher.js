const amqp = require('amqplib');
const { randomUUID } = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

const ROUTING_KEY_MAP = {
  BOOKING_ACCEPTED: 'booking.accepted',
  BOOKING_SERVICE_STARTED: 'booking.started',
  BOOKING_SERVICE_COMPLETED: 'booking.completed'
};

class NotificationPublisher {
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
    this.connection = await amqp.connect(env.rabbitmqUri);
    this.connection.on('error', (error) => {
      logger.error({ message: 'RabbitMQ connection error in booking-service.', error: error.message });
    });
    this.connection.on('close', () => {
      logger.warn({ message: 'RabbitMQ connection closed in booking-service. Resetting publisher state.' });
      this.connection = null;
      this.channel = null;
    });

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(env.rabbitmqExchange, 'topic', { durable: true });
    return this.channel;
  }

  async publish(eventType, payload) {
    const routingKey = ROUTING_KEY_MAP[eventType];
    if (!routingKey) {
      return false;
    }

    if (!payload?.customerId) {
      logger.warn({ message: `Skipping ${eventType} notification publish because customerId is missing.` });
      return false;
    }

    const message = {
      eventId: randomUUID(),
      userId: String(payload.customerId),
      timestamp: new Date().toISOString(),
      payload: {
        bookingId: payload.bookingId,
        bookingNumber: payload.bookingNumber || null,
        providerId: payload.providerId || null,
        providerName: payload.providerName || payload.providerSnapshot?.businessName || null,
        providerSnapshot: payload.providerSnapshot || null,
        customerPhone: payload.customerPhone || null
      }
    };

    const channel = await this.connect();
    channel.publish(
      env.rabbitmqExchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        contentType: 'application/json',
        persistent: true,
        messageId: message.eventId,
        timestamp: Date.now(),
        type: routingKey
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

module.exports = new NotificationPublisher();
