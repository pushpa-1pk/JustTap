const BookingRepository = require('../../../repositories/booking.repository');
const { BOOKING_STATUS } = require('../../../constants/booking-status');

class ProviderQueryService {
  constructor() {
    this.bookingRepo = new BookingRepository();
  }

  /**
   * Retrieves paginated job requests currently waiting for provider response boundaries
   */
  async getPendingRequests(providerId) {
    return this.bookingRepo.findPendingProviderRequests(providerId);
  }

  /**
   * Resolves active, on-site, or en-route job assignments for a provider
   */
  async getActiveJobs(providerId, page = 1, limit = 10) {
    const filter = {
      providerId,
      bookingStatus: {
        $in: [
          BOOKING_STATUS.PROVIDER_ACCEPTED,
          BOOKING_STATUS.ON_THE_WAY,
          BOOKING_STATUS.ARRIVED,
          BOOKING_STATUS.SERVICE_STARTED,
          BOOKING_STATUS.SERVICE_COMPLETED,
          BOOKING_STATUS.PAYMENT_PENDING
        ]
      }
    };
    return this.bookingRepo.findPaginated(filter, { page, limit, sort: { scheduledStartTime: 1 } });
  }

  /**
   * Fetches full historical fulfillment ledger sets for a provider
   */
  async getHistoryLog(providerId, { page = 1, limit = 10, status = null, search = '' } = {}) {
    const filter = {
      providerId,
      bookingStatus: status 
        ? status.toUpperCase()
        : { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.FAILED] }
    };

    if (search) {
      filter.$or = [
        { 'serviceDetails.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.fullName': { $regex: search, $options: 'i' } },
        { bookingNumber: { $regex: search, $options: 'i' } }
      ];
    }

    return this.bookingRepo.findPaginated(filter, { page, limit });
  }
}

module.exports = ProviderQueryService;