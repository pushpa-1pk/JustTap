const OutboxWorker = require('../workers/outbox.worker');
const logger = require('../utils/logger');

class OutboxPublisherJob {
  constructor() {
    this.worker = new OutboxWorker();
    this.isActive = false;
    this.timerId = null;
  }

  start(pollingIntervalMs = 1000) {
    if (this.isActive) return;
    this.isActive = true;

    const run = async () => {
      if (!this.isActive) return;
      try {
        await this.worker.processPendingEvents(50);
      } catch (error) {
        logger.error({ job: 'OutboxPublisherJob', error: error.message });
      } finally {
        // Safe recursive scheduling guarantees no execution overlaps
        if (this.isActive) {
          this.timerId = setTimeout(run, pollingIntervalMs);
        }
      }
    };

    this.timerId = setTimeout(run, pollingIntervalMs);
    logger.info({ message: 'OutboxPublisherJob daemon loop started.' });
  }

  stop() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info({ message: 'OutboxPublisherJob loop stopped cleanly.' });
  }
}

module.exports = OutboxPublisherJob;