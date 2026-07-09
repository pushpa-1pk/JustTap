const BookingRepository = require('../../repositories/booking.repository');
const BookingRescheduleRepository = require('../../repositories/booking-reschedule.repository');
const ReschedulePolicyService = require('./reschedule-policy.service');
const ProviderAvailabilityService = require('../provider/provider-availability.service');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const ApiError = require('../../utils/api.error');
const { BOOKING_EVENTS } = require('../../constants/event.constants');
const { RESCHEDULE_STATUS } = require('../../constants/reschedule.constants');

class RescheduleService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.rescheduleRepo = new BookingRescheduleRepository();
    this.policyService = new ReschedulePolicyService();
    this.availabilityService = new ProviderAvailabilityService();
    this.timelineService = new BookingTimelineService();
    this.eventService = new BookingEventService();
  }

  /**
   * Applies the scheduling adjustments within a clean transactional database context
   */
  async executeReschedule(bookingId, actor, dto, session = null) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking instance unmapped or invalid.', 404);

    // 1. Evaluate policy and timing constraints
    this.policyService.validateBookingState(booking);
    this.policyService.validateProposedTime(booking, dto.newStartTime, dto.newEndTime);

    // 2. Perform availability lookup via our isolated calendar adapter proxy
    if (booking.providerId) {
      const isAvailable = await this.availabilityService.isAvailable(
        booking.providerId,
        dto.newStartTime,
        dto.newEndTime
      );
      if (!isAvailable) {
        throw new ApiError('Scheduling Conflict: The assigned provider is unavailable at the requested time.', 409);
      }
    }

    const previousStartTime = booking.scheduledStartTime;
    const previousEndTime = booking.scheduledEndTime;

    // 3. Persist the schedule updates through our specialized, atomic repository method
    const updatedBooking = await this.bookingRepo.updateSchedule(
      bookingId,
      dto.newStartTime,
      dto.newEndTime,
      session
    );

    if (!updatedBooking) {
      throw new ApiError('Concurrency Lock Encountered: Reschedule action aborted due to internal state mismatch.', 409);
    }

    // 4. Log transaction metadata to the child historical tracking collection
    const rescheduleLogPayload = {
      bookingId,
      requestedBy: { userId: actor.userId, role: actor.role },
      previousStartTime,
      previousEndTime,
      proposedStartTime: new Date(dto.newStartTime),
      proposedEndTime: new Date(dto.newEndTime),
      reason: dto.reasonCode,
      approvalStatus: RESCHEDULE_STATUS.ACCEPTED
    };
    await this.rescheduleRepo.create(rescheduleLogPayload, session);

    // 5. Append detailed timeline logs using explicit action events rather than artificial transitions
    await this.timelineService.logTransition({
      booking: updatedBooking,
      fromStatus: booking.bookingStatus,
      toStatus: booking.bookingStatus,
      actor,
      metadata: {
        action: 'BOOKING_RESCHEDULED',
        oldStartTime: previousStartTime.toISOString(),
        newStartTime: new Date(dto.newStartTime).toISOString(),
        reasonCode: dto.reasonCode
      },
      session
    });

    // 6. Queue events into the outbox to alert downstream microservices asynchronously
    await this.eventService.dispatchEvent(
      bookingId,
      BOOKING_EVENTS.RESCHEDULED || 'BOOKING_RESCHEDULED',
      {
        bookingId,
        bookingNumber: booking.bookingNumber,
        oldStartTime: previousStartTime,
        newStartTime: dto.newStartTime,
        requestedBy: { userId: actor.userId, role: actor.role } // Hydrated actor context details block
      },
      session
    );

    return updatedBooking;
  }
}

module.exports = RescheduleService;
