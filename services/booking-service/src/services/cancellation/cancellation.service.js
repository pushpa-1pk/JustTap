const BookingRepository = require('../../repositories/booking.repository');
const BookingCancellationRepository = require('../../repositories/booking-cancellation.repository');
const BookingStateMachine = require('../booking/booking-state-machine');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const CancellationPolicyService = require('./cancellation-policy.service');
const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { PAYMENT_STATUS } = require('../../constants/payment-status');
const { BOOKING_EVENTS } = require('../../constants/event.constants');
const { REFUND_STATUS } = require('../../constants/cancellation.constants');

class CancellationService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.cancellationRepo = new BookingCancellationRepository();
    this.policyService = new CancellationPolicyService();
    this.timelineService = new BookingTimelineService();
    this.eventService = new BookingEventService();
  }

  async executeCancellation(bookingId, actor, reasonCode, customExplanation = '', session = null) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    const currentStatus = booking.bookingStatus;

    // Enforce rule-matrix context evaluations using our updated State Machine
    BookingStateMachine.verifyTransitionContext(booking, BOOKING_STATUS.CANCELLED, actor);

    const financials = this.policyService.calculateFinancials(booking, actor.role);

    const cancellationPayload = {
      bookingId: booking._id,
      cancelledBy: { userId: actor.userId, role: actor.role },
      reasonCode,
      customExplanation,
      penaltyApplied: financials.penaltyApplied,
      refundStatus: financials.refundStatus,
      platformLoss: financials.platformLoss
    };

    // Save cancellation metadata across documents atomically
    await this.cancellationRepo.create(cancellationPayload, session);
    
    const updatedBooking = await this.bookingRepo.updateStatus(booking._id, currentStatus, BOOKING_STATUS.CANCELLED, session);

    // Apply decoupled processing hooks if payment requires refunding steps
    if (financials.refundStatus === REFUND_STATUS.PROCESSING) {
      await this.bookingRepo.update(booking._id, { paymentStatus: PAYMENT_STATUS.PROCESSING }, session);
    }

    await this.timelineService.logTransition({
      booking,
      fromStatus: currentStatus,
      toStatus: BOOKING_STATUS.CANCELLED,
      actor,
      metadata: { reasonCode, penaltyApplied: financials.penaltyApplied },
      session
    });

    // Fire outbox messages populated with complete context blocks for Phase 8 ledger setups
    await this.eventService.dispatchEvent(
      booking._id,
      BOOKING_EVENTS.CANCELLED,
      {
        bookingNumber: booking.bookingNumber,
        cancelledBy: actor.role,
        reasonCode,
        financials: {
          totalPaidAmount: booking.snapshotPricing.totalAmountToPay,
          refundProcessedAmount: financials.refundProcessedAmount,
          penaltyApplied: financials.penaltyApplied
        },
        paymentIntegrationSnapshot: {
          refundReferenceId: null,
          refundReason: reasonCode,
          paymentStatus: PAYMENT_STATUS.PROCESSING
        }
      },
      session
    );

    return updatedBooking;
  }
}

module.exports = CancellationService;
