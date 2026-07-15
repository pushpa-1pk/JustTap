const amqp = require("amqplib");
const { randomUUID } = require("crypto");
const env = require("../config/env");
const { logger } = require("../config/logger");

const ROUTING_KEY_MAP = {
  "payment.captured": "payment.success",
  "payment.refunded": "payment.refunded"
};

class RabbitMqBroker {
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
    this.connection = await amqp.connect(env.messaging.rabbitmqUri);
    this.connection.on("error", (error) => {
      logger.error("RabbitMQ connection error in payment-service", { error });
    });
    this.connection.on("close", () => {
      logger.warn("RabbitMQ connection closed in payment-service. Resetting publisher channel.");
      this.connection = null;
      this.channel = null;
    });

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(env.messaging.exchange, "topic", { durable: true });
    return this.channel;
  }

  async publish(eventType, message) {
    const publication = this._normalizeEvent(eventType, message);
    if (!publication) {
      logger.debug(`Skipping non-notification outbox event ${eventType}`);
      return false;
    }

    const channel = await this.connect();
    channel.publish(
      env.messaging.exchange,
      publication.routingKey,
      Buffer.from(JSON.stringify(publication.body)),
      {
        contentType: "application/json",
        persistent: true,
        messageId: publication.body.eventId,
        timestamp: Date.now(),
        type: publication.routingKey,
        correlationId: message.meta?.correlationId
      }
    );

    logger.info("Published payment domain event to RabbitMQ", {
      eventType,
      routingKey: publication.routingKey,
      eventId: publication.body.eventId,
      userId: publication.body.userId
    });

    return true;
  }

  _normalizeEvent(eventType, message) {
    if (eventType === "wallet.updated") {
      return this._mapWalletUpdate(message);
    }

    const routingKey = ROUTING_KEY_MAP[eventType];
    if (!routingKey) {
      return null;
    }

    const payload = message.data || {};
    const userId = payload.customerId;
    if (!userId) {
      logger.warn(`Skipping ${eventType} publish because customerId is missing.`, { payload });
      return null;
    }

    return {
      routingKey,
      body: {
        eventId: randomUUID(),
        userId: String(userId),
        timestamp: new Date().toISOString(),
        payload: this._buildPaymentPayload(routingKey, payload)
      }
    };
  }

  _mapWalletUpdate(message) {
    const payload = message.data || {};
    const routingKey = payload.direction === "DEBIT" ? "wallet.debit" : "wallet.credit";
    const userId = payload.providerId;
    if (!userId) {
      logger.warn("Skipping wallet.updated publish because providerId is missing.", { payload });
      return null;
    }

    return {
      routingKey,
      body: {
        eventId: randomUUID(),
        userId: String(userId),
        timestamp: new Date().toISOString(),
        payload: {
          bookingId: payload.bookingId || null,
          transactionId: payload.ledgerEntryId || null,
          amount: this._formatPaise(payload.amountPaise),
          balance: this._formatPaise(
            payload.balanceType === "AVAILABLE"
              ? payload.availableBalancePaise
              : payload.pendingBalancePaise
          ),
          code: payload.code,
          balanceType: payload.balanceType,
          direction: payload.direction
        }
      }
    };
  }

  _buildPaymentPayload(routingKey, payload) {
    if (routingKey === "payment.refunded") {
      return {
        bookingId: payload.bookingId || null,
        refundId: payload.refundId || null,
        transactionId: payload.gatewayRefundId || null,
        amount: this._formatPaise(payload.amountPaise),
        status: payload.status || null
      };
    }

    return {
      bookingId: payload.bookingId || null,
      transactionId: payload.gatewayPaymentId || payload.paymentId || null,
      amount: this._formatPaise(payload.amountPaidPaise),
      paymentMethod: payload.paymentMethod || null,
      capturedAt: payload.capturedAt || null
    };
  }

  _formatPaise(value) {
    if (!Number.isFinite(value)) {
      return null;
    }

    return Number((value / 100).toFixed(2));
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

module.exports = new RabbitMqBroker();
