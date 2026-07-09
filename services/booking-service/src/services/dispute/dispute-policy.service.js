const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { TIMEOUT_CONFIGS } = require('../../constants/booking.constants');

class DisputePolicyService {
  /**
   * Enforces timeline and status rules before allowing a dispute to be raised
   * @param {Object} booking - Lean booking document context
   */
  validateDisputeEligibility(booking) {
    // Disputes can only be raised on jobs that have crossed the line to completion or failure
    const validDisputeStatuses = [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.FAILED,
      BOOKING_STATUS.SERVICE_COMPLETED
    ];

    if (!validDisputeStatuses.includes(booking.bookingStatus)) {
      throw new ApiError(`Dispute Denied: A booking cannot be disputed while it is in the active status "${booking.bookingStatus}".`, 422);
    }

    // Enforce SLA time windows (e.g., maximum 24 hours post-service completion)
    const baselineTime = booking.completedAt || booking.updatedAt;
    const hoursElapsed = (Date.now() - new Date(baselineTime).getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > TIMEOUT_CONFIGS.DISPUTE_WINDOW_MAX_HOURS) {
      throw new ApiError(`Dispute Denied: The strict SLA window of ${TIMEOUT_CONFIGS.DISPUTE_WINDOW_MAX_HOURS} hours to dispute this booking has expired.`, 400);
    }
  }
}

module.exports = DisputePolicyService;