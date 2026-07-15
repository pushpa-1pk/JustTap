const ApiError = require("../utils/ApiError");
const { logger } = require("../config/logger");
const walletRepository = require("../repositories/wallet.repository");
const ledgerRepository = require("../repositories/walletTransaction.repository");
const outboxRepository = require("../repositories/outbox.repository");

const MAX_LOCK_RETRIES = 3;
const RETRY_BACKOFF_BASE_MS = 50;

class WalletService {
  /**
   * Appends a balanced transaction row to the ledger and updates the wallet cache projection
   * @param {Object} entryParams Structured ledger execution variables
   * @param {ClientSession} session MongoDB ACID session proxy context
   */
  async appendLedgerEntry(entryParams, session) {
    let attempt = 0;

    while (attempt < MAX_LOCK_RETRIES) {
      try {
        return await this._executeLedgerWrite(entryParams, session);
      } catch (error) {
        // Intercept 409 Version Conflict codes to run our recovery system
        if (error.statusCode === 409) {
          attempt++;
          logger.warn(`Optimistic concurrency collision encountered (Attempt ${attempt}/${MAX_LOCK_RETRIES}). Executing recovery backoff...`, {
            providerId: entryParams.providerId,
            code: entryParams.code
          });
          
          if (attempt >= MAX_LOCK_RETRIES) {
            logger.error("[CRITICAL] Wallet version retry loops exhausted. Aborting transaction chain.");
            throw error;
          }
          
          // Execute an exponential backoff retry loop with slight jitter adjustments
          const delay = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt) + Math.random() * 20;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  async getOrInitializeWallet(providerId, session = null) {
    return walletRepository.upsertWallet(providerId, session);
  }

  async _executeLedgerWrite(entryParams, session) {
    const { providerId, code, amountPaise, balanceType, direction, referenceModel, referenceId, correlationId, createdBy } = entryParams;

    // Use our updated repository method to eliminate broken encapsulation vectors
    const wallet = await walletRepository.upsertWallet(providerId, session);
    const currentBaseBalance = balanceType === "AVAILABLE" ? wallet.availableBalancePaise : wallet.pendingBalancePaise;
    
    const modifier = direction === "CREDIT" ? amountPaise : -amountPaise;
    const openingBalancePaise = currentBaseBalance;
    const closingBalancePaise = openingBalancePaise + modifier;

    // Explicit Invariant Check: Verify balances remain valid before processing repository calls
    if (closingBalancePaise < 0) {
      throw new ApiError(400, `Ledger Error: Payout values result in a negative balance state inside lane: ${balanceType}.`);
    }

    // Step 1: Append the immutable row entry straight to the ledger collection
    const ledgerRecord = await ledgerRepository.create({
      walletId: wallet._id,
      providerId,
      type: `${direction}_${code}`,
      amountPaise,
      balanceType,
      openingBalancePaise,
      closingBalancePaise,
      referenceModel,
      referenceId,
      description: code,
      correlationId,
      createdBy
    }, session);

    // Step 2: Define modifications to update the high-speed wallet cache projection layer
    const balanceField = balanceType === "AVAILABLE" ? "availableBalancePaise" : "pendingBalancePaise";
    const balanceIncrements = { [balanceField]: modifier };

    /**
     * Explicit Business Rule Definition - Lifetime Earnings:
     * Lifetime earnings are calculated strictly when escrow clearance parameters match 
     * and funds transition directly to AVAILABLE tracking status.
     */
    if (code === "SETTLEMENT_FUNDS_RELEASED" && balanceType === "AVAILABLE") {
      balanceIncrements.lifetimeEarningsPaise = amountPaise;
    }

    // Pass structural validation changes down to the repository update wrapper method
    const updatedWallet = await walletRepository.updateBalancesWithVersionCheck(
      providerId,
      balanceIncrements,
      wallet.version,
      session
    );

    await outboxRepository.queueDomainEvent({
      aggregateType: "Wallet",
      aggregateId: updatedWallet._id,
      eventType: "wallet.updated",
      payload: {
        providerId,
        walletId: updatedWallet._id,
        ledgerEntryId: ledgerRecord._id,
        bookingId: entryParams.bookingId || null,
        balanceType,
        amountPaise,
        direction,
        code,
        availableBalancePaise: updatedWallet.availableBalancePaise,
        pendingBalancePaise: updatedWallet.pendingBalancePaise,
        withdrawnBalancePaise: updatedWallet.withdrawnBalancePaise,
        lifetimeEarningsPaise: updatedWallet.lifetimeEarningsPaise
      },
      correlationId
    }, session);

    return ledgerRecord;
  }
}

module.exports = new WalletService();
