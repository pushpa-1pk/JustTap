const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { BOOKING_TYPES } = require('../../constants/booking.constants');
const { RESCHEDULE_LIMITS } = require('../../constants/reschedule.constants');

class ReschedulePolicyService {
  /**
   * Enforces JustTap lifecycle criteria rules against the targeted booking document
   */
  validateBookingState(booking) {
    // JustTap Business Rule: On-demand Instant requests are locked against rescheduling
    if (booking.bookingType === BOOKING_TYPES.INSTANT) {
      throw new ApiError('Policy Violation: Instant on-demand bookings cannot be rescheduled.', 400);
    }

    const reschedulableStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.SEARCHING_PROVIDER,
      BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
      BOOKING_STATUS.PROVIDER_ACCEPTED,
      BOOKING_STATUS.ON_THE_WAY
    ];

    if (!reschedulableStatuses.includes(booking.bookingStatus)) {
      throw new ApiError(`Policy Violation: Rescheduling is blocked while booking is in status "${booking.bookingStatus}".`, 422);
    }

    if (booking.rescheduleCount >= RESCHEDULE_LIMITS.MAX_RESCHEDULES) {
      throw new ApiError('SLA Enforcement: Maximum reschedule limit allocations reached for this asset.', 409);
    }
  }

  /**
   * Validates proposed time parameters against platform buffers and structural limits
   */
  validateProposedTime(booking, proposedStart, proposedEnd) {
    const now = new Date();
    const proposedStartDate = new Date(proposedStart);
    const proposedEndDate = new Date(proposedEnd);
    const currentStartDate = new Date(booking.scheduledStartTime);

    // Business Rule Validation: Ensure the requested time actually constitutes a change
    if (proposedStartDate.getTime() === currentStartDate.getTime()) {
      throw new ApiError('Input Parameter Conflict: The proposed time is identical to the current reservation slot.', 400);
    }

    const minNoticeBufferMs = RESCHEDULE_LIMITS.MIN_NOTICE_MINUTES * 60 * 1000;
    if (proposedStartDate.getTime() < now.getTime() + minNoticeBufferMs) {
      throw new ApiError(`SLA Constraint: Rescheduling requires a minimum notice buffer of ${RESCHEDULE_LIMITS.MIN_NOTICE_MINUTES} minutes.`, 400);
    }

    if (proposedEndDate <= proposedStartDate) {
      throw new ApiError('Validation Failure: Proposed execution end time must succeed start time chronologically.', 400);
    }
  }
}

module.exports = ReschedulePolicyService;