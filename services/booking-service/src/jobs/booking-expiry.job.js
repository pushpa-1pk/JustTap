const BookingRepository = require('../repositories/booking.repository');
const CancellationService = require('../services/cancellation/cancellation.service');
const { BOOKING_STATUS } = require('../constants/booking-status');
const { CANCELLATION_REASON } = require('../constants/cancellation.constants');
const { withTransaction } = require('../helpers/transaction.helper');
const logger = require('../utils/logger');

class BookingExpiryJob {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.cancellationService = new CancellationService();
    this.isActive = false;
    this.timerId = null;
  }

  start(pollingIntervalMs = 300000) {
    if (this.isActive) return;
    this.isActive = true;

    const run = async () => {
      if (!this.isActive) return;
      try {
        const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));

        // Indexed search query eliminating multi-row collection scanning
        const abandonedBookings = await this.bookingRepo.find({
          bookingStatus: BOOKING_STATUS.PROVIDER_ACCEPTED,
          scheduledStartTime: { $lt: twoHoursAgo }
        });

        const systemActor = { userId: 'SYSTEM_EXPIRY_SCHEDULER', role: 'SYSTEM' };

        for (const booking of abandonedBookings) {
          try {
            await withTransaction(async (session) => {
              await this.cancellationService.executeCancellation(
                booking._id,
                systemActor,
                CANCELLATION_REASON.PROVIDER_NO_SHOW,
                'Automated Expiry: Processed due to provider no-show timeline breach.',
                session
              );
            });
          } catch (innerErr) {
            logger.error({ job: 'BookingExpiryJob', bookingId: booking._id, error: innerErr.message });
          }
        }
      } catch (error) {
        logger.error({ job: 'BookingExpiryJob', error: error.message });
      } finally {
        if (this.isActive) {
          this.timerId = setTimeout(run, pollingIntervalMs);
        }
      }
    };

    this.timerId = setTimeout(run, pollingIntervalMs);
    logger.info({ message: 'BookingExpiryJob daemon running.' });
  }

  stop() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info({ message: 'BookingExpiryJob loop terminated cleanly.' });
  }
}

module.exports = BookingExpiryJob;