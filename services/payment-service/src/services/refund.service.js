const crypto = require("crypto");
const { LedgerCode } = require("../constants/financial.constants");
const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { runInTransaction } = require("../utils/transaction");
const walletService = require("./wallet.service");
const gatewayClient = require("./clients/gateway.client");
const outboxRepository = require("../repositories/outbox.repository");
const paymentRepository = require("../repositories/payment.repository");
const refundRepository = require("../repositories/refund.repository");
const settlementRepository = require("../repositories/settlement.repository");

class RefundService {
  async executeMarketplaceRefund(params) {
    const { bookingId, amountPaise, reason, externalIdempotencyKey, correlationId, approvedBy } = params;
    const internalIdempotencyHash = crypto.createHash("sha256").update(externalIdempotencyKey).digest("hex");

    const existingRefund = await refundRepository.findByIdempotencyKey(internalIdempotencyHash);
    if (existingRefund) {
      logger.warn("Idempotent refund request already processed. Returning historical record.", { bookingId });
      return existingRefund;
    }

    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new ApiError(404, "Refund halted: Linked payment record not found.");
    }
    if (amountPaise > payment.amountPaidPaise) {
      throw new ApiError(400, "Refund validation violation: Requested amount exceeds original payment values.");
    }

    const settlement = await settlementRepository.findByPaymentId(payment._id);
    const hasActivePayout = settlement && settlement.status === "SETTLED";

    let gatewayRefund;
    try {
      gatewayRefund = await gatewayClient.refundPayment(payment.gatewayPaymentId, amountPaise, {
        bookingId: bookingId.toString(),
        reason
      });
    } catch (error) {
      logger.error("Gateway communications failure during refund execution", { error, bookingId });
      throw new ApiError(502, "Failed to execute refund transfer with external gateway vendor.");
    }

    return runInTransaction(async (session) => {
      let refundRecord;
      try {
        refundRecord = await refundRepository.create({
          paymentId: payment._id,
          bookingId,
          gatewayRefundId: gatewayRefund.id,
          amountPaise,
          reason,
          status: "PROCESSED",
          idempotencyKey: internalIdempotencyHash,
          correlationId,
          approvedBy: approvedBy || "CUSTOMER_SERVICE_OVERRIDE",
          approvedAt: new Date(),
          processedAt: new Date()
        }, session);
      } catch (error) {
        if (error.code === 11000) {
          return refundRepository.findByIdempotencyKey(internalIdempotencyHash);
        }
        throw error;
      }

      await walletService.appendLedgerEntry({
        providerId: payment.providerId,
        code: LedgerCode.REFUND_REVERSAL,
        amountPaise,
        balanceType: hasActivePayout ? "AVAILABLE" : "PENDING",
        direction: "DEBIT",
        referenceModel: "Refund",
        referenceId: refundRecord._id,
        correlationId,
        createdBy: refundRecord.approvedBy
      }, session);

      payment.status = amountPaise === payment.amountPaidPaise ? "REFUNDED" : "PARTIALLY_REFUNDED";
      await payment.save({ session });

      await outboxRepository.queueDomainEvent({
        aggregateType: "Payment",
        aggregateId: payment._id,
        eventType: "payment.refunded",
        payload: {
          paymentId: payment._id,
          bookingId,
          customerId: payment.customerId,
          providerId: payment.providerId,
          refundId: refundRecord._id,
          gatewayRefundId: refundRecord.gatewayRefundId,
          amountPaise,
          status: payment.status
        },
        correlationId
      }, session);

      logger.info("Marketplace clawback refund transaction completed successfully", { bookingId, amountPaise });
      return refundRecord;
    });
  }
}

module.exports = new RefundService();
