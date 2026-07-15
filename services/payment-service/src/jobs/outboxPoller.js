const os = require("os");
const env = require("../config/env");
const outboxRepository = require("../repositories/outbox.repository");
const { logger } = require("../config/logger");

class OutboxPoller {
  constructor(eventBrokerClient) {
    this.broker = eventBrokerClient;
    this.isRunning = false;
    this.workerId = `worker:${os.hostname()}:${process.pid}`;
    this.batchSize = env.outbox.batchSize;
    this.loopDelayMs = env.outbox.loopIntervalMs;
    this.zombieReclaimMs = 10 * 60 * 1000;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    logger.info("Stateless Outbox Poller active", { workerId: this.workerId });
    return this._runLoop();
  }

  async _runLoop() {
    while (this.isRunning) {
      try {
        await this._cleanZombieProcesses();
        const processedCount = await this.executeCycle();
        if (processedCount === 0) {
          await new Promise((resolve) => setTimeout(resolve, this.loopDelayMs));
        }
      } catch (error) {
        logger.error("Outbox poller execution frame encountered an error loop", { error });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async executeCycle() {
    const claimableEvents = await outboxRepository.fetchClaimableBatch(this.batchSize);
    if (claimableEvents.length === 0) {
      return 0;
    }

    for (const event of claimableEvents) {
      const lockedEvent = await outboxRepository.lockEventForWorker(event._id, this.workerId);
      if (!lockedEvent) {
        continue;
      }

      try {
        await this.broker.publish(lockedEvent.eventType, {
          meta: {
            schemaVersion: lockedEvent.schemaVersion,
            sequenceNumber: lockedEvent.sequenceNumber,
            correlationId: lockedEvent.correlationId
          },
          data: lockedEvent.payload
        });

        await outboxRepository.model.findByIdAndUpdate(lockedEvent._id, {
          $set: { status: "PROCESSED", workerId: null, lockedAt: null }
        });
      } catch (brokerError) {
        const exponentialBackoffMs = Math.pow(2, Math.max(1, lockedEvent.attempts)) * 1000;
        await outboxRepository.releaseFailedEvent(
          lockedEvent._id,
          brokerError.stack || brokerError.message,
          exponentialBackoffMs
        );
      }
    }

    return claimableEvents.length;
  }

  async _cleanZombieProcesses() {
    try {
      const result = await outboxRepository.reclaimZombieLocks(this.zombieReclaimMs);
      if (result.modifiedCount > 0) {
        logger.warn(`Zombie cleanup routine recovered ${result.modifiedCount} stranded outbox event records.`);
      }
    } catch (error) {
      logger.error("Zombie lock reclamation loop encountered an error", { error });
    }
  }

  stop() {
    this.isRunning = false;
    logger.info("Outbox Poller worker shutdown sequence initiated.");
  }
}

module.exports = OutboxPoller;
