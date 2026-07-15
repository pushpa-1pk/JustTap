const { LedgerCode } = require("../constants/financial.constants");
const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { encryptSensitiveString } = require("../utils/crypto");
const { runInTransaction } = require("../utils/transaction");
const walletService = require("./wallet.service");
const withdrawalRepository = require("../repositories/withdrawal.repository");
const outboxRepository = require("../repositories/outbox.repository");

class WithdrawalService {
  async requestProviderWithdrawal(params) {
    const { providerId, amountPaise, bankDetails, correlationId } = params;

    if (amountPaise < 10000) {
      throw new ApiError(400, "Withdrawal validation failed: Minimum cash-out limit is 100 INR.");
    }

    const encryptedBankDetails = {
      accountNumber: encryptSensitiveString(bankDetails.accountNumber),
      ifscCode: encryptSensitiveString(bankDetails.ifscCode),
      accountHolderName: encryptSensitiveString(bankDetails.accountHolderName)
    };

    return runInTransaction(async (session) => {
      const wallet = await walletService.getOrInitializeWallet(providerId, session);
      if (wallet.availableBalancePaise < amountPaise) {
        throw new ApiError(400, "Withdrawal request rejected: Insufficient available balance.");
      }

      const withdrawalRecord = await withdrawalRepository.create({
        walletId: wallet._id,
        providerId,
        amountPaise,
        status: "REQUESTED",
        encryptedBankDetails,
        correlationId
      }, session);

      await walletService.appendLedgerEntry({
        providerId,
        code: LedgerCode.WITHDRAWAL_REQUESTED,
        amountPaise,
        balanceType: "AVAILABLE",
        direction: "DEBIT",
        referenceModel: "Withdrawal",
        referenceId: withdrawalRecord._id,
        correlationId,
        createdBy: `PROVIDER_${providerId}`
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Withdrawal",
        aggregateId: withdrawalRecord._id,
        eventType: "withdrawal.requested",
        payload: {
          withdrawalId: withdrawalRecord._id,
          providerId,
          amountPaise,
          status: withdrawalRecord.status
        },
        correlationId
      }, session);

      logger.info("Withdrawal request created and funds locked in hold state", { providerId, amountPaise });
      return withdrawalRecord;
    });
  }
}

module.exports = new WithdrawalService();
