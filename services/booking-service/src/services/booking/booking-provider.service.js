const BookingRepository = require('../../repositories/booking.repository');
const BookingStateMachine = require('./booking-state-machine');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { BOOKING_EVENTS } = require('../../constants/event.constants');

class BookingProviderService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.timelineService = new BookingTimelineService();
    this.stateMachine = BookingStateMachine;
    this.eventService = new BookingEventService();
  }

  /**
   * Processes a provider's acceptance of a booking request with concurrency protection
   */
  async accept(bookingId, actor, session) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    this.stateMachine.verifyTransitionContext(booking, BOOKING_STATUS.PROVIDER_ACCEPTED, actor);

    const updatedBooking = await this.bookingRepo.updateStatus(
      bookingId,
      BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
      BOOKING_STATUS.PROVIDER_ACCEPTED,
      session
    );

    if (!updatedBooking) {
      throw new ApiError('Concurrency Conflict: This booking request was already picked up or modified by another worker thread.', 409);
    }

    await this.timelineService.logTransition({
      booking,
      fromStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
      toStatus: BOOKING_STATUS.PROVIDER_ACCEPTED,
      actor,
      session
    });

    await this.eventService.dispatchEvent(
      bookingId,
      BOOKING_EVENTS.ACCEPTED,
      { bookingNumber: booking.bookingNumber, providerId: actor.userId },
      session
    );

    return updatedBooking;
  }

  /**
   * Processes timeouts or rejections and routes the booking to the next best provider in the queue
   */
  async handleRejectOrTimeout(bookingId, fallbackCandidateProvider, session) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    if (booking.bookingStatus !== BOOKING_STATUS.PENDING_PROVIDER_RESPONSE) {
      throw new ApiError('Operational Error: Booking request is no longer open for assignment updates.', 400);
    }

    if (booking.bookingType === 'INSTANT' && fallbackCandidateProvider) {
      const updatedBooking = await this.bookingRepo.cycleNextProviderFallback(bookingId, fallbackCandidateProvider, session);

      await this.timelineService.logTransition({
        booking,
        fromStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        toStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        actor: { userId: booking.customerId, role: 'SYSTEM' },
        metadata: { fallbackProvider: fallbackCandidateProvider.businessName },
        session
      });

      await this.eventService.dispatchEvent(
        bookingId,
        BOOKING_EVENTS.ROUTED_FALLBACK,
        { nextProviderId: fallbackCandidateProvider.providerId },
        session
      );

      return updatedBooking;
    } else if (booking.bookingType === 'INSTANT') {
      const updatedBooking = await this.bookingRepo.updateStatus(
        bookingId,
        BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        BOOKING_STATUS.SEARCHING_PROVIDER,
        session
      );

      await this.timelineService.logTransition({
        booking,
        fromStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        toStatus: BOOKING_STATUS.SEARCHING_PROVIDER,
        actor: { userId: booking.customerId, role: 'SYSTEM' },
        metadata: { reason: 'PROVIDER_TIMEOUT_REQUEUE' },
        session
      });

      await this.eventService.dispatchEvent(
        bookingId,
        BOOKING_EVENTS.ROUTED_FALLBACK,
        { nextProviderId: null, requiresRematch: true },
        session
      );

      return updatedBooking;
    } else {
      const updatedBooking = await this.bookingRepo.updateStatus(
        bookingId,
        BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        BOOKING_STATUS.FAILED,
        session
      );

      await this.timelineService.logTransition({
        booking,
        fromStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        toStatus: BOOKING_STATUS.FAILED,
        actor: { userId: booking.customerId, role: 'SYSTEM' },
        metadata: { reason: 'CANDIDATE_POOL_EXHAUSTED' },
        session
      });

      await this.eventService.dispatchEvent(bookingId, BOOKING_EVENTS.ALLOCATION_FAILED, {}, session);
      return updatedBooking;
    }
  }
}

module.exports = BookingProviderService;
