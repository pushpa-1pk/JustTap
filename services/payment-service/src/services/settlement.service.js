const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const { SettlementStatus, LedgerCode, SystemOperator } = require("../constants/financial.constants");
const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { runInTransaction } = require("../utils/transaction");
const walletService = require("./wallet.service");
const paymentRepository = require("../repositories/payment.repository");
const settlementRepository = require("../repositories/settlement.repository");
const outboxRepository = require("../repositories/outbox.repository");

const MAX_ORCHESTRATION_RETRIES = 4;
const BACKOFF_INITIAL_DELAY_MS = 60;

class SettlementService {
  async createEscrowSettlement({ payment, paymentId, correlationId, session = null }) {
    const resolvedPayment = payment || await paymentRepository.findById(paymentId, session);
    if (!resolvedPayment) {
      throw new ApiError(404, "Payment not found for settlement creation.");
    }

    const createSettlement = async (activeSession) => {
      const existingSettlement = await settlementRepository.findByPaymentId(resolvedPayment._id, activeSession);
      if (existingSettlement) {
        return existingSettlement;
      }

      const netPayoutPaise = Math.max(
        0,
        resolvedPayment.amountPaidPaise -
          resolvedPayment.financialSnapshot.platformFeePaise -
          resolvedPayment.financialSnapshot.platformGSTPaise -
          resolvedPayment.financialSnapshot.providerGSTPaise -
          resolvedPayment.financialSnapshot.tdsPaise -
          resolvedPayment.financialSnapshot.tcsPaise -
          resolvedPayment.financialSnapshot.otherDeductionsPaise
      );

      const settlement = await settlementRepository.create({
        paymentId: resolvedPayment._id,
        bookingId: resolvedPayment.bookingId,
        providerId: resolvedPayment.providerId,
        grossAmountPaise: resolvedPayment.amountPaidPaise,
        platformFeePaise: resolvedPayment.financialSnapshot.platformFeePaise,
        platformGSTPaise: resolvedPayment.financialSnapshot.platformGSTPaise,
        providerGSTPaise: resolvedPayment.financialSnapshot.providerGSTPaise,
        tdsPaise: resolvedPayment.financialSnapshot.tdsPaise,
        tcsPaise: resolvedPayment.financialSnapshot.tcsPaise,
        otherDeductionsPaise: resolvedPayment.financialSnapshot.otherDeductionsPaise,
        netPayoutPaise,
        status: SettlementStatus.PENDING,
        correlationId
      }, activeSession);

      await walletService.appendLedgerEntry({
        providerId: settlement.providerId,
        code: LedgerCode.SETTLEMENT_ESCROW_INIT,
        amountPaise: settlement.netPayoutPaise,
        balanceType: "PENDING",
        direction: "CREDIT",
        referenceModel: "Settlement",
        referenceId: settlement._id,
        correlationId,
        createdBy: SystemOperator.SYSTEM_SETTLEMENT_ENGINE
      }, activeSession);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Settlement",
        aggregateId: settlement._id,
        eventType: "settlement.created",
        payload: {
          settlementId: settlement._id,
          paymentId: resolvedPayment._id,
          bookingId: resolvedPayment.bookingId,
          providerId: resolvedPayment.providerId,
          netPayoutPaise: settlement.netPayoutPaise,
          holdHours: env.financials.settlementHoldHours
        },
        correlationId
      }, activeSession);

      return settlement;
    };

    if (session) {
      return createSettlement(session);
    }

    return runInTransaction(createSettlement);
  }

  async releaseEscrowToAvailable(settlementId, correlationId, operatorName) {
    let attempt = 0;

    while (attempt < MAX_ORCHESTRATION_RETRIES) {
      try {
        return await this._executeReleaseTransaction(settlementId, correlationId, operatorName);
      } catch (error) {
        attempt++;

        const isTransient =
          error.statusCode === 409 ||
          (error instanceof mongoose.Error.MongoServerError && error.hasErrorLabel("TransientTransactionError")) ||
          (error instanceof mongoose.Error.MongoServerError && error.code === 112);

        if (isTransient && attempt < MAX_ORCHESTRATION_RETRIES) {
          const delay = BACKOFF_INITIAL_DELAY_MS * Math.pow(2, attempt) + (Math.random() * 25);
          logger.warn("Transient settlement conflict caught. Retrying workflow.", {
            settlementId,
            correlationId,
            attempt,
            delayMs: Math.round(delay)
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  }

  async _executeReleaseTransaction(settlementId, correlationId, operatorName) {
    return runInTransaction(async (session) => {
      const updatedSettlement = await settlementRepository.advanceSettlementStateAtomic(
        settlementId,
        SettlementStatus.PENDING,
        {
          status: SettlementStatus.SETTLED,
          settledAt: new Date(),
          approvedBy: operatorName || SystemOperator.SYSTEM_RECONCILIATION_JOB,
          approvedAt: new Date()
        },
        session
      );

      if (!updatedSettlement) {
        throw new ApiError(409, "Atomic state transition collision occurred. Target settlement status is no longer PENDING.");
      }

      await walletService.appendLedgerEntry({
        providerId: updatedSettlement.providerId,
        code: LedgerCode.SETTLEMENT_FUNDS_RELEASED,
        amountPaise: updatedSettlement.netPayoutPaise,
        balanceType: "PENDING",
        direction: "DEBIT",
        referenceModel: "Settlement",
        referenceId: updatedSettlement._id,
        correlationId,
        createdBy: updatedSettlement.approvedBy
      }, session);

      await walletService.appendLedgerEntry({
        providerId: updatedSettlement.providerId,
        code: LedgerCode.SETTLEMENT_FUNDS_RELEASED,
        amountPaise: updatedSettlement.netPayoutPaise,
        balanceType: "AVAILABLE",
        direction: "CREDIT",
        referenceModel: "Settlement",
        referenceId: updatedSettlement._id,
        correlationId,
        createdBy: updatedSettlement.approvedBy
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Settlement",
        aggregateId: updatedSettlement._id,
        eventType: "settlement.released",
        payload: {
          eventId: uuidv4(),
          occurredAt: new Date().toISOString(),
          settlementId: updatedSettlement._id,
          providerId: updatedSettlement.providerId,
          netPayoutPaise: updatedSettlement.netPayoutPaise,
          settledAt: updatedSettlement.settledAt
        },
        correlationId
      }, session);

      return updatedSettlement;
    });
  }
}

module.exports = new SettlementService();
