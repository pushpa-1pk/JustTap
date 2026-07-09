const BookingRepository = require('../../../repositories/booking.repository');
const BookingDisputeRepository = require('../../../repositories/booking-dispute.repository');
const BookingTimelineRepository = require('../../../repositories/booking-timeline.repository');

class AdminQueryService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.disputeRepo = new BookingDisputeRepository();
    this.timelineRepo = new BookingTimelineRepository();
  }

  async searchBookings(filter = {}, page = 1, limit = 10) {
    return this.bookingRepo.findPaginated(filter, { page, limit });
  }

  async listActiveDisputes(filter = {}, page = 1, limit = 10) {
    return this.disputeRepo.findPaginated(filter, { page, limit, sort: { createdAt: -1 } });
  }

  async fetchFullAuditTimeline(bookingId) {
    return this.timelineRepo.fetchChronologicalHistory(bookingId);
  }

  /**
   * Executes analytical calculations across the database cluster without impacting the write engine
   */
  async getAnalyticsOverview() {
    const aggregationPipeline = [
      {
        $group: {
          _id: '$bookingStatus',
          volumeCount: { $sum: 1 },
          grossGrossRevenue: { $sum: '$snapshotPricing.totalAmountToPay' }
        }
      }
    ];

    const results = await this.bookingRepo.aggregate(aggregationPipeline);
    
    return results.reduce((accumulator, segment) => {
      accumulator[segment._id] = {
        count: segment.volumeCount,
        revenue: segment.grossGrossRevenue
      };
      return accumulator;
    }, {});
  }
}

module.exports = AdminQueryService;