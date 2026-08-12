const BookingRepository = require('../../repositories/booking.repository');
const BookingStateMachine = require('./booking-state-machine');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const OTPService = require('../otp/otp.service');
const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { PAYMENT_STATUS } = require('../../constants/payment-status');
const { BOOKING_EVENTS } = require('../../constants/event.constants');
const { OTP_PURPOSE } = require('../../constants/otp.constants');

class BookingStatusService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.timelineService = new BookingTimelineService();
    this.stateMachine = BookingStateMachine;
    this.eventService = new BookingEventService();
    this.otpService = new OTPService();
  }

  /**
   * Advances active bookings step-by-step through valid lifecycle stages
   */
  async advance(bookingId, nextStatus, actor, session) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    if ([BOOKING_STATUS.SERVICE_STARTED, BOOKING_STATUS.SERVICE_COMPLETED].includes(nextStatus)) {
      throw new ApiError('This transition requires OTP verification and cannot be advanced directly.', 422);
    }

    const currentStatus = booking.bookingStatus;
    this.stateMachine.verifyTransitionContext(booking, nextStatus, actor);

    const updatedBooking = await this.bookingRepo.updateStatus(bookingId, currentStatus, nextStatus, session);
    if (!updatedBooking) throw new ApiError('Concurrency Lock Encountered: State transition aborted.', 409);

    await this.timelineService.logTransition({
      booking,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actor,
      session
    });

    if (nextStatus === BOOKING_STATUS.ARRIVED) {
      await this.otpService.generateVerificationOTP(bookingId, OTP_PURPOSE.START_SERVICE, session);
      await this.eventService.dispatchEvent(bookingId, BOOKING_EVENTS.OTP_GENERATED, { purpose: OTP_PURPOSE.START_SERVICE }, session);
    }

    await this.eventService.dispatchEvent(bookingId, `BOOKING_${nextStatus}`, { bookingNumber: booking.bookingNumber }, session);
    return updatedBooking;
  }

  /**
   * Verifies incoming cleartext codes against secure bcrypt hashes to authorize handshakes
   */
  async verifyHandshake(bookingId, rawOtp, purpose, actor, completionPhotos = [], session) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    const nextStatus = purpose === OTP_PURPOSE.START_SERVICE ? BOOKING_STATUS.SERVICE_STARTED : BOOKING_STATUS.SERVICE_COMPLETED;
    this.stateMachine.verifyTransitionContext(booking, nextStatus, actor);

    await this.otpService.verifyVerificationOTP(bookingId, rawOtp, session);

    const updatedBooking = await this.bookingRepo.updateStatus(bookingId, booking.bookingStatus, nextStatus, session);

    await this.timelineService.logTransition({
      booking,
      fromStatus: booking.bookingStatus,
      toStatus: nextStatus,
      actor,
      metadata: { verification: 'OTP_SUCCESS' },
      session
    });

    await this.eventService.dispatchEvent(bookingId, `OTP_VERIFIED_${purpose}`, { bookingNumber: booking.bookingNumber }, session);

    if (nextStatus === BOOKING_STATUS.SERVICE_STARTED) {
      await this.otpService.generateVerificationOTP(bookingId, OTP_PURPOSE.COMPLETE_SERVICE, session);
      await this.eventService.dispatchEvent(
        bookingId,
        BOOKING_EVENTS.OTP_GENERATED,
        { purpose: OTP_PURPOSE.COMPLETE_SERVICE },
        session
      );
    }

    if (nextStatus === BOOKING_STATUS.SERVICE_COMPLETED) {
      const updateData = { paymentStatus: PAYMENT_STATUS.PAID };
      if (Array.isArray(completionPhotos) && completionPhotos.length > 0) {
        updateData.completionPhotos = completionPhotos;
      }
      await this.bookingRepo.update(bookingId, updateData, session);
    }

    return updatedBooking;
  }
}
module.exports = BookingStatusService;
