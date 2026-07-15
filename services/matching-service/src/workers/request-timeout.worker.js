const env = require("../config/env");
const logger = require("../config/logger");

class RequestTimeoutWorker {
  constructor(bookingRequestService) {
    this.requestService = bookingRequestService;
    this.timer = null;
    this.running = false;
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.timer = setInterval(async () => {
      try {
        const expiredIds =
          await this.requestService.requestRepo.popExpiredBookingIds(Date.now());

        for (const bookingId of expiredIds) {
          await this.requestService.handleTimedOutRequest(bookingId);
        }
      } catch (error) {
        logger.error("request_timeout_worker_error", { message: error.message });
      }
    }, env.TIMEOUT_WORKER_POLL_INTERVAL_MS);

    this.timer.unref?.();
    logger.info("request_timeout_worker_started");
  }

  async stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info("request_timeout_worker_stopped");
  }
}

module.exports = RequestTimeoutWorker;
