const BookingOTPRepository = require('../repositories/booking-otp.repository');
const logger = require('../utils/logger');

class OTPCleanupJob {
  constructor() {
    this.otpRepo = new BookingOTPRepository();
    this.isActive = false;
    this.timerId = null;
  }

  start(pollingIntervalMs = 60000) {
    if (this.isActive) return;
    this.isActive = true;

    const run = async () => {
      if (!this.isActive) return;
      try {
        // Locate missing anomalies that outlived the native DB TTL index monitor cycle
        const driftAnomaliesCount = await this.otpRepo.count({
          verifiedAt: null,
          expiresAt: { $lte: new Date(Date.now() - 300000) } // Stale past a 5-minute buffer
        });

        if (driftAnomaliesCount > 0) {
          logger.warn({
            message: 'TTL processing drift anomaly caught in database layer.',
            job: 'OTPCleanupJob',
            staleCount: driftAnomaliesCount
          });
        }
      } catch (error) {
        logger.error({ job: 'OTPCleanupJob', error: error.message });
      } finally {
        if (this.isActive) {
          this.timerId = setTimeout(run, pollingIntervalMs);
        }
      }
    };

    this.timerId = setTimeout(run, pollingIntervalMs);
    logger.info({ message: 'OTPCleanupJob tracking engine active.' });
  }

  stop() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info({ message: 'OTPCleanupJob tracker deactivated.' });
  }
}

module.exports = OTPCleanupJob;