const { withTransaction } = require('../../helpers/transaction.helper');
const BookingCreationService = require('./booking-creation.service');
const BookingProviderService = require('./booking-provider.service');
const BookingStatusService = require('./booking-status.service');
const BookingRepository = require('../../repositories/booking.repository');

class BookingService {
  constructor() {
    this.creationService = new BookingCreationService();
    this.providerService = new BookingProviderService();
    this.statusService = new BookingStatusService();
    this.bookingRepo = new BookingRepository();
  }

  async createBooking(actor, dto) {
    try {
      return await withTransaction(async (session) => {
        return this.creationService.create(actor, dto, session);
      });
    } catch (error) {
      // A concurrent retry can lose the unique-index race. Return the original
      // booking rather than letting the client create a duplicate request.
      if (error?.code === 11000 && actor.idempotencyKey) {
        const existingBooking = await this.bookingRepo.findByCustomerAndIdempotencyKey(
          actor.userId,
          actor.idempotencyKey
        );
        if (existingBooking) return existingBooking;
      }
      throw error;
    }
  }

  async acceptBooking(bookingId, actor) {
    return withTransaction(async (session) => {
      return this.providerService.accept(bookingId, actor, session);
    });
  }

  async advanceStatus(bookingId, nextStatus, actor) {
    return withTransaction(async (session) => {
      return this.statusService.advance(bookingId, nextStatus, actor, session);
    });
  }

  async verifyServiceHandshake(bookingId, rawOtp, purpose, actor, completionPhotos = []) {
    return withTransaction(async (session) => {
      return this.statusService.verifyHandshake(bookingId, rawOtp, purpose, actor, completionPhotos, session);
    });
  }

  async rejectOrTimeoutBooking(bookingId, fallbackCandidateProvider = null) {
    return withTransaction(async (session) => {
      return this.providerService.handleRejectOrTimeout(bookingId, fallbackCandidateProvider, session);
    });
  }
}

module.exports = BookingService;
