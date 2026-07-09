const { withTransaction } = require('../../helpers/transaction.helper');
const BookingCreationService = require('./booking-creation.service');
const BookingProviderService = require('./booking-provider.service');
const BookingStatusService = require('./booking-status.service');

class BookingService {
  constructor() {
    this.creationService = new BookingCreationService();
    this.providerService = new BookingProviderService();
    this.statusService = new BookingStatusService();
  }

  async createBooking(actor, dto) {
    return withTransaction(async (session) => {
      return this.creationService.create(actor, dto, session);
    });
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

  async verifyServiceHandshake(bookingId, rawOtp, purpose, actor) {
    return withTransaction(async (session) => {
      return this.statusService.verifyHandshake(bookingId, rawOtp, purpose, actor, session);
    });
  }

  async rejectOrTimeoutBooking(bookingId, fallbackCandidateProvider = null) {
    return withTransaction(async (session) => {
      return this.providerService.handleRejectOrTimeout(bookingId, fallbackCandidateProvider, session);
    });
  }
}

module.exports = BookingService;