const BookingRepository = require('../../repositories/booking.repository');
const BookingTimelineRepository = require('../../repositories/booking-timeline.repository');
const BookingDisputeRepository = require('../../repositories/booking-dispute.repository');
const DisputeMessageRepository = require('../../repositories/dispute-message.repository');
const ApiError = require('../../utils/api.error');

class BookingQueryService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.timelineRepo = new BookingTimelineRepository();
    this.disputeRepo = new BookingDisputeRepository();
    this.messageRepo = new DisputeMessageRepository();
  }

  /**
   * Fetches paginated history for a customer
   */
  async getCustomerHistory(customerId, page, limit) {
    return this.bookingRepo.findCustomerBookings(customerId, page, limit);
  }

  /**
   * Fetches active jobs assigned to a provider
   */
  async getProviderActiveJobs(providerId, page, limit) {
    return this.bookingRepo.findProviderBookings(providerId, page, limit);
  }

  /**
   * Resolves a booking by ID, enforcing multi-tenant visibility controls
   */
  async getBookingDetails(bookingId, actor) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Booking record not found.', 404);

    // Enforce tenant visibility boundaries
    if (actor.role === 'CUSTOMER' && booking.customerId.toString() !== actor.userId) {
      throw new ApiError('Access Denied: Resource visibility unauthorized.', 403);
    }
    if (actor.role === 'PROVIDER' && booking.providerId?.toString() !== actor.userId) {
      throw new ApiError('Access Denied: Resource visibility unauthorized.', 403);
    }

    return booking;
  }

  /**
   * Retrieves the comprehensive timeline history trace for an active booking
   */
  async getBookingTimeline(bookingId) {
    return this.timelineRepo.fetchChronologicalHistory(bookingId);
  }

  /**
   * Fetches conversation threads for a dispute, automatically applying visibility filters
   */
  async getDisputeThread(disputeId, actor) {
    const includeInternalNotes = actor.role === 'ADMIN';
    return this.messageRepo.fetchThread(disputeId, includeInternalNotes);
  }
}

module.exports = BookingQueryService;