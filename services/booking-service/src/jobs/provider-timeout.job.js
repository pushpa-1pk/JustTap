const BookingRepository = require('../repositories/booking.repository');
const BookingService = require('../services/booking/booking.service');
const { BOOKING_STATUS } = require('../constants/booking-status');
const { TIMEOUT_CONFIGS } = require('../constants/booking.constants');
const logger = require('../utils/logger');

class ProviderTimeoutJob {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.bookingService = new BookingService();
    this.isActive = false;
    this.timerId = null;
  }

  start(pollingIntervalMs = 5000) {
    if (this.isActive) return;
    this.isActive = true;

    const run = async () => {
      if (!this.isActive) return;
      try {
        const timeoutThresholdMs = TIMEOUT_CONFIGS.PROVIDER_ACCEPT_TIMEOUT_MS || 60000;
        const targetExpirationTime = new Date(Date.now() - timeoutThresholdMs);

        // High-performance covered index search matching our repository query schema
        const expiredAllocations = await this.bookingRepo.find({
          bookingStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
          requestedAt: { $lte: targetExpirationTime }
        });

        for (const booking of expiredAllocations) {
          try {
            await this.bookingService.rejectOrTimeoutBooking(booking._id, null);
          } catch (innerErr) {
            logger.error({ job: 'ProviderTimeoutJob', bookingId: booking._id, error: innerErr.message });
          }
        }
      } catch (error) {
        logger.error({ job: 'ProviderTimeoutJob', error: error.message });
      } finally {
        if (this.isActive) {
          this.timerId = setTimeout(run, pollingIntervalMs);
        }
      }
    };

    this.timerId = setTimeout(run, pollingIntervalMs);
    logger.info({ message: 'ProviderTimeoutJob engine loop activated.' });
  }

  stop() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info({ message: 'ProviderTimeoutJob stopped.' });
  }
}

module.exports = ProviderTimeoutJob;