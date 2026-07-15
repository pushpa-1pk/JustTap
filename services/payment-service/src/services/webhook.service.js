const crypto = require("crypto");
const env = require("../config/env");
const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { redisClient } = require("../config/redis");
const { runInTransaction } = require("../utils/transaction");
const paymentService = require("./payment.service");
const outboxRepository = require("../repositories/outbox.repository");
const paymentOrderRepository = require("../repositories/paymentOrder.repository");
const paymentRepository = require("../repositories/payment.repository");
const paymentEventRepository = require("../repositories/paymentEvent.repository");

class WebhookService {
  async processGatewayWebhook(payload, signature) {
    this._verifyWebhookSignature(payload, signature);

    const event = JSON.parse(payload);
    const gatewayEventId = event.id;
    const eventType = event.event;
    const redisIdempotencyKey = `webhook:lock:${gatewayEventId}`;

    const isUnique = await redisClient.set(
      redisIdempotencyKey,
      JSON.stringify({ status: "processing", startedAt: new Date().toISOString() }),
      { NX: true, PX: 300000 }
    );

    if (!isUnique) {
      logger.warn("Duplicate webhook injection attempt caught at entry lock gate", { gatewayEventId, eventType });
      return false;
    }

    try {
      const duplicateLogged = await paymentEventRepository.checkEventExists(gatewayEventId);
      if (duplicateLogged) {
        await redisClient.set(redisIdempotencyKey, JSON.stringify({ status: "completed" }), { EX: 86400 });
        return true;
      }

      let resolutionStatus = false;
      switch (eventType) {
        case "payment.captured":
          resolutionStatus = await this._handlePaymentCaptured(event);
          break;
        case "payment.failed":
          resolutionStatus = await this._handlePaymentFailed(event);
          break;
        default:
          logger.info("Received unhandled webhook event", { eventType });
          resolutionStatus = true;
      }

      if (resolutionStatus) {
        await redisClient.set(redisIdempotencyKey, JSON.stringify({ status: "completed" }), { EX: 86400 });
      }

      return resolutionStatus;
    } catch (error) {
      logger.error("Internal transaction system failure while processing webhook event", {
        gatewayEventId,
        eventType,
        error
      });
      await redisClient.del(redisIdempotencyKey);
      throw error;
    }
  }

  _verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac("sha256", env.gateway.webhookSecret)
      .update(payload)
      .digest("hex");

    const expected = Buffer.from(expectedSignature);
    const provided = Buffer.from(signature || "");

    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
      throw new ApiError(400, "Webhook transmission rejected: Signature token validation verification failed.");
    }
  }

  async _handlePaymentCaptured(event) {
    const paymentEntity = event.payload.payment.entity;
    const gatewayOrderId = paymentEntity.order_id;
    const gatewayPaymentId = paymentEntity.id;

    const orderRecord = await paymentOrderRepository.findByGatewayOrderId(gatewayOrderId);
    if (!orderRecord) {
      logger.error("Orphaned webhook processing sequence halted: Order reference not found", { gatewayOrderId });
      return false;
    }

    const existingPayment = await paymentRepository.findByGatewayPaymentId(gatewayPaymentId);
    if (existingPayment) {
      logger.info("Webhook capture skipped because payment already exists", { gatewayPaymentId });
      return true;
    }

    await paymentService.executePaymentCapturePipeline({
      orderRecord,
      gatewayPaymentId,
      paymentMethod: paymentEntity.method,
      rawPayloadSnapshot: { source: "WEBHOOK_INGEST", gatewayRawBody: event },
      correlationId: orderRecord.correlationId,
      requestId: orderRecord.requestId
    });

    await paymentEventRepository.create({
      paymentOrderId: orderRecord._id,
      gatewayEventId: event.id,
      eventType: "WEBHOOK_RECEIVED",
      payloadSnapshot: { source: "WEBHOOK_INGEST", gatewayRawBody: event },
      correlationId: orderRecord.correlationId,
      requestId: orderRecord.requestId
    });

    return true;
  }

  async _handlePaymentFailed(event) {
    const paymentEntity = event.payload.payment.entity;
    const gatewayOrderId = paymentEntity.order_id;
    const orderRecord = await paymentOrderRepository.findByGatewayOrderId(gatewayOrderId);
    if (!orderRecord) {
      return false;
    }

    if (orderRecord.status === "COMPLETED") {
      logger.warn("Ignoring payment.failed for an already completed payment order", { gatewayOrderId });
      return true;
    }

    return runInTransaction(async (session) => {
      const updatedOrder = await paymentOrderRepository.advanceStateAtomic(gatewayOrderId, "FAILED", session);
      if (!updatedOrder) {
        return true;
      }

      await paymentEventRepository.create({
        paymentOrderId: orderRecord._id,
        gatewayEventId: event.id,
        eventType: "PAYMENT_FAILED",
        payloadSnapshot: { source: "WEBHOOK_INGEST", gatewayRawBody: event },
        correlationId: orderRecord.correlationId,
        requestId: orderRecord.requestId
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "PaymentOrder",
        aggregateId: orderRecord._id,
        eventType: "payment.failed",
        payload: {
          paymentOrderId: orderRecord._id,
          bookingId: orderRecord.bookingId,
          gatewayOrderId,
          gatewayEventId: event.id,
          failureReason: paymentEntity.error_description || null
        },
        correlationId: orderRecord.correlationId
      }, session);

      return true;
    });
  }
}

module.exports = new WebhookService();
