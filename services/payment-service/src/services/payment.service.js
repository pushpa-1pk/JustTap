const crypto = require("crypto");
const env = require("../config/env");
const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { runInTransaction } = require("../utils/transaction");
const gatewayClient = require("./clients/gateway.client");
const outboxRepository = require("../repositories/outbox.repository");
const paymentOrderRepository = require("../repositories/paymentOrder.repository");
const paymentRepository = require("../repositories/payment.repository");
const paymentEventRepository = require("../repositories/paymentEvent.repository");

const CURRENCY_INR = "INR";
const ALLOWED_CAPTURE_SOURCE_STATUSES = ["PENDING"];

class PaymentService {
  async createPaymentOrder(orderData) {
    const { bookingId, customerId, providerId, amountPaise, bookingSnapshot, correlationId, requestId } = orderData;

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new ApiError(400, "Pricing violation: Amount must resolve to a positive non-zero paise integer.");
    }

    const existingPayment = await paymentRepository.findByBookingId(bookingId);
    if (existingPayment) {
      throw new ApiError(409, "Payment has already been completed for this booking.");
    }

    const pendingOrder = await paymentOrderRepository.findPendingByBookingId(bookingId);
    if (pendingOrder) {
      return pendingOrder;
    }

    let gatewayOrder;
    try {
      gatewayOrder = await gatewayClient.createOrder({
        amount: amountPaise,
        currency: CURRENCY_INR,
        receipt: `rcpt_${bookingId.toString().substring(0, 14)}`,
        notes: { bookingId: bookingId.toString(), correlationId }
      });
    } catch (error) {
      logger.error("Gateway link down during order provision step", { error, bookingId });
      throw new ApiError(502, "Failed to create payment order with the gateway vendor.");
    }

    return runInTransaction(async (session) => {
      let orderRecord;
      try {
        orderRecord = await paymentOrderRepository.create({
          bookingId,
          customerId,
          providerId,
          gatewayOrderId: gatewayOrder.id,
          amount: amountPaise,
          currency: CURRENCY_INR,
          status: "PENDING",
          attempts: 1,
          bookingSnapshot,
          correlationId,
          requestId
        }, session);
      } catch (error) {
        if (error.code === 11000) {
          const existingOrder = await paymentOrderRepository.findPendingByBookingId(bookingId, session);
          if (existingOrder) {
            return existingOrder;
          }
        }
        throw error;
      }

      await paymentEventRepository.create({
        paymentOrderId: orderRecord._id,
        eventType: "PAYMENT_CREATED",
        payloadSnapshot: { id: gatewayOrder.id, status: gatewayOrder.status },
        correlationId,
        requestId
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "PaymentOrder",
        aggregateId: orderRecord._id,
        eventType: "payment.created",
        payload: {
          paymentOrderId: orderRecord._id,
          bookingId,
          customerId,
          providerId,
          gatewayOrderId: orderRecord.gatewayOrderId,
          amountPaise: orderRecord.amount,
          currency: orderRecord.currency
        },
        correlationId
      }, session);

      return orderRecord;
    });
  }

  async verifyAndCapturePayment(verificationData) {
    const {
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      actorUserId,
      correlationId,
      requestId
    } = verificationData;

    this._verifySignature(gatewayOrderId, gatewayPaymentId, gatewaySignature);

    const orderRecord = await paymentOrderRepository.findByGatewayOrderId(gatewayOrderId);
    if (!orderRecord) {
      throw new ApiError(404, "Verification halted: Linked payment order record not found.");
    }

    if (String(orderRecord.customerId) !== String(actorUserId)) {
      throw new ApiError(403, "This payment order does not belong to the authenticated customer.");
    }

    const existingPayment = await paymentRepository.findByGatewayPaymentId(gatewayPaymentId);
    if (existingPayment) {
      logger.warn("Payment already resolved. Returning existing state.", { gatewayPaymentId });
      return existingPayment;
    }

    let gatewayPaymentDetails = await this._fetchGatewayPayment(gatewayPaymentId);
    if (gatewayPaymentDetails.status === "authorized") {
      gatewayPaymentDetails = await this._captureGatewayPayment(gatewayPaymentId, orderRecord.amount);
    }

    this._validateGatewayPayment(gatewayPaymentDetails, orderRecord);

    return this.executePaymentCapturePipeline({
      orderRecord,
      gatewayPaymentId,
      paymentMethod: gatewayPaymentDetails.method,
      gatewaySignatureHash: crypto.createHash("sha256").update(gatewaySignature).digest("hex"),
      rawPayloadSnapshot: { source: "CLIENT_VERIFICATION_FLOW", paymentDetails: gatewayPaymentDetails },
      correlationId,
      requestId
    });
  }

  async executePaymentCapturePipeline({
    orderRecord,
    gatewayPaymentId,
    paymentMethod,
    gatewaySignatureHash = null,
    rawPayloadSnapshot,
    correlationId,
    requestId
  }) {
    if (!ALLOWED_CAPTURE_SOURCE_STATUSES.includes(orderRecord.status)) {
      throw new ApiError(409, `State transition rejected: Cannot advance payment order from status: ${orderRecord.status} to COMPLETED.`);
    }

    const financialSnapshot = this._calculateFinancialSnapshot(orderRecord.amount);

    return runInTransaction(async (session) => {
      const updatedOrder = await paymentOrderRepository.advanceStateAtomic(orderRecord.gatewayOrderId, "COMPLETED", session);

      if (!updatedOrder) {
        const raceRecoveredPayment = await paymentRepository.findByBookingId(orderRecord.bookingId, session);
        if (raceRecoveredPayment) {
          return raceRecoveredPayment;
        }

        throw new ApiError(409, "Atomic state transition collision occurred. Payment order state has already shifted.");
      }

      const paymentRecord = await paymentRepository.create({
        bookingId: orderRecord.bookingId,
        paymentOrderId: orderRecord._id,
        customerId: orderRecord.customerId,
        providerId: orderRecord.providerId,
        gatewayPaymentId,
        gatewaySignatureHash,
        amountPaidPaise: orderRecord.amount,
        paymentMethod,
        status: "CAPTURED",
        financialSnapshot,
        capturedAt: new Date(),
        correlationId,
        requestId
      }, session);

      await paymentEventRepository.create({
        paymentOrderId: orderRecord._id,
        paymentId: paymentRecord._id,
        eventType: "PAYMENT_CAPTURED",
        payloadSnapshot: rawPayloadSnapshot,
        correlationId,
        requestId
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Payment",
        aggregateId: paymentRecord._id,
        eventType: "payment.verified",
        payload: {
          paymentId: paymentRecord._id,
          paymentOrderId: orderRecord._id,
          bookingId: orderRecord.bookingId,
          gatewayOrderId: orderRecord.gatewayOrderId,
          gatewayPaymentId
        },
        correlationId
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Payment",
        aggregateId: paymentRecord._id,
        eventType: "payment.captured",
        payload: {
          paymentId: paymentRecord._id,
          paymentOrderId: orderRecord._id,
          bookingId: orderRecord.bookingId,
          customerId: orderRecord.customerId,
          providerId: orderRecord.providerId,
          gatewayPaymentId,
          amountPaidPaise: paymentRecord.amountPaidPaise,
          paymentMethod,
          capturedAt: paymentRecord.capturedAt
        },
        correlationId
      }, session);

      const settlementService = require("./settlement.service");
      await settlementService.createEscrowSettlement({
        payment: paymentRecord,
        correlationId,
        session
      });

      logger.info("Payment record captured successfully", {
        bookingId: orderRecord.bookingId,
        paymentId: paymentRecord._id,
        gatewayPaymentId,
        correlationId
      });

      return paymentRecord;
    });
  }

  _verifySignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
      .createHmac("sha256", env.gateway.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expected = Buffer.from(generatedSignature);
    const provided = Buffer.from(signature || "");

    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
      throw new ApiError(403, "Payment verification failed: Cryptographic signature mismatch detected.");
    }
  }

  async _fetchGatewayPayment(gatewayPaymentId) {
    try {
      return await gatewayClient.fetchPayment(gatewayPaymentId);
    } catch (error) {
      logger.error("Gateway connection error resolving checkout trace", { error, gatewayPaymentId });
      throw new ApiError(502, "Failed to resolve payment details from gateway network provider.");
    }
  }

  async _captureGatewayPayment(gatewayPaymentId, amountPaise) {
    try {
      return await gatewayClient.capturePayment(gatewayPaymentId, amountPaise, CURRENCY_INR);
    } catch (error) {
      logger.error("Gateway capture call failed", { error, gatewayPaymentId, amountPaise });
      throw new ApiError(502, "Failed to capture the payment with the gateway provider.");
    }
  }

  _validateGatewayPayment(paymentDetails, orderRecord) {
    if (paymentDetails.status !== "captured") {
      throw new ApiError(400, `Validation rejected: Gateway status is: ${paymentDetails.status}`);
    }
    if (Number(paymentDetails.amount) !== orderRecord.amount) {
      throw new ApiError(400, "Validation rejected: Amount validation mismatch.");
    }
    if (paymentDetails.currency !== CURRENCY_INR) {
      throw new ApiError(400, `Validation rejected: Unsupported currency variant: ${paymentDetails.currency}`);
    }
    if (paymentDetails.order_id !== orderRecord.gatewayOrderId) {
      throw new ApiError(400, "Validation rejected: Order ID crosscheck validation match failed.");
    }
  }

  _calculateFinancialSnapshot(grossAmountPaise) {
    const commissionPercent = env.financials.platformCommissionPercent;
    const gstPercent = env.financials.gstPercentOnCommission;
    const platformFeePaise = Math.round(grossAmountPaise * (commissionPercent / 100));
    const platformGSTPaise = Math.round(platformFeePaise * (gstPercent / 100));

    return {
      platformFeePaise,
      platformGSTPaise,
      providerGSTPaise: 0,
      tdsPaise: 0,
      tcsPaise: 0,
      otherDeductionsPaise: 0,
      currency: CURRENCY_INR
    };
  }
}

module.exports = new PaymentService();
