const mongoose = require("mongoose");
const env = require("../config/env");
const settlementRepository = require("../repositories/settlement.repository");
const settlementService = require("../services/settlement.service");
const { logger } = require("../config/logger");

class BackgroundReconciliationScheduler {
  constructor() {
    this.isExecutionLoopRunning = false;
    this.loopInterval = null;
    this.holdWindowMs = env.financials.settlementHoldHours * 60 * 60 * 1000;
  }

  start(intervalMs = 60000) { // Evaluates ledger boundaries every 60 seconds
    if (this.isExecutionLoopRunning) return;
    this.isExecutionLoopRunning = true;
    logger.info("Automated Background Hold Reconciliation Scheduler loop active");

    this.loopInterval = setInterval(() => this.reconcilePendingEscrowSettlements(), intervalMs);
  }

  async reconcilePendingEscrowSettlements() {
    const expirationThresholdTime = new Date(Date.now() - this.holdWindowMs);

    // Identify settlements whose escrow release parameters have matured
    try {
      const claimableSettlements = await settlementRepository.model.find({
        status: "PENDING",
        createdAt: { $lte: expirationThresholdTime }
      })
      .limit(50)
      .exec();

      if (claimableSettlements.length === 0) return;

      logger.info(`Found ${claimableSettlements.length} matured settlements ready for clearance release.`);

      for (const settlement of claimableSettlements) {
        try {
          const systemCorrelationId = `cron-recon-${settlement._id}-${Date.now()}`;
          
          // Execute the complete orchestration transaction unit of work cleanly
          await settlementService.releaseEscrowToAvailable(
            settlement._id,
            systemCorrelationId,
            "AUTOMATED_CRON_RECONCILIATION_ENGINE"
          );
          
        } catch (settlementError) {
          logger.error(`Automated clearance script failed for record entry ID: ${settlement._id}`, {
            error: settlementError.message
          });
          // Do not throw; preserve loop execution continuity to let adjacent records clear successfully
        }
      }
    } catch (clusterError) {
      logger.error("Reconciliation query sweep loop failed on cluster level parameters", { clusterError });
    }
  }

  stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
    }
    this.isExecutionLoopRunning = false;
    logger.info("Automated Background Reconciliation Job disconnected cleanly.");
  }
}

module.exports = new BackgroundReconciliationScheduler();
