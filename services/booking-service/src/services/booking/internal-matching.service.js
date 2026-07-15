const { withTransaction } = require('../../helpers/transaction.helper');
const BookingRepository = require('../../repositories/booking.repository');
const BookingProviderService = require('./booking-provider.service');
const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');

class InternalMatchingService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.providerService = new BookingProviderService();
  }

  normalizeRole(role) {
    return String(role || '').trim().toUpperCase();
  }

  async getBookingById(bookingId) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found.', 404);
    }

    return booking;
  }

  async startMatchingRequest(bookingId, payload) {
    return withTransaction(async (session) => {
      const existing = await this.bookingRepo.findById(bookingId);
      if (!existing) {
        throw new ApiError('Booking not found.', 404);
      }

      if (
        existing.bookingStatus === BOOKING_STATUS.PENDING_PROVIDER_RESPONSE &&
        String(existing.providerId) === String(payload.providerId)
      ) {
        return existing;
      }

      const updated = await this.bookingRepo.assignProviderForMatching(
        bookingId,
        payload.providerId,
        payload.providerSnapshot || {},
        payload.expectedStatuses || [
          BOOKING_STATUS.REQUESTED,
          BOOKING_STATUS.SEARCHING_PROVIDER
        ],
        session
      );

      if (!updated) {
        throw new ApiError(
          'Booking is not in a state that allows provider matching.',
          409
        );
      }

      return updated.toObject ? updated.toObject() : updated;
    });
  }

  async acceptMatchingRequest(bookingId, providerId) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found.', 404);
    }

    if (booking.bookingStatus === BOOKING_STATUS.PROVIDER_ACCEPTED) {
      return booking;
    }

    const actor = { userId: providerId, role: 'PROVIDER' };
    return this.providerService.accept(bookingId, actor, null);
  }

  async rejectMatchingRequest(bookingId, fallbackCandidateProvider) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found.', 404);
    }

    if (booking.bookingStatus !== BOOKING_STATUS.PENDING_PROVIDER_RESPONSE) {
      return booking;
    }

    return this.providerService.handleRejectOrTimeout(
      bookingId,
      fallbackCandidateProvider || null,
      null
    );
  }

  async verifyTrackingAccess(bookingId, userId, role) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found.', 404);
    }

    const normalizedRole = this.normalizeRole(role);
    const activeTrackingStatuses = new Set([
      BOOKING_STATUS.PROVIDER_ASSIGNED,
      BOOKING_STATUS.PROVIDER_ACCEPTED,
      BOOKING_STATUS.ON_THE_WAY,
      BOOKING_STATUS.ARRIVED,
      BOOKING_STATUS.SERVICE_STARTED,
      BOOKING_STATUS.SERVICE_COMPLETED,
      BOOKING_STATUS.PAYMENT_PENDING,
      BOOKING_STATUS.PAID
    ]);

    let isTrackingAllowed = false;

    if (normalizedRole === 'ADMIN') {
      isTrackingAllowed = activeTrackingStatuses.has(booking.bookingStatus);
    }

    if (normalizedRole === 'CUSTOMER') {
      isTrackingAllowed =
        String(booking.customerId) === String(userId) &&
        activeTrackingStatuses.has(booking.bookingStatus);
    }

    if (normalizedRole === 'PROVIDER') {
      isTrackingAllowed =
        String(booking.providerId) === String(userId) &&
        activeTrackingStatuses.has(booking.bookingStatus);
    }

    return {
      isTrackingAllowed,
      bookingStatus: booking.bookingStatus
    };
  }
}

module.exports = new InternalMatchingService();
