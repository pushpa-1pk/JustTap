const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { PAYMENT_STATUS } = require('../../constants/payment-status');
const { STATE_TRANSITION_MATRIX } = require('../../constants/booking.constants');

class BookingStateMachine {
  canTransition(currentStatus, nextStatus) {
    const allowedTargets = STATE_TRANSITION_MATRIX[currentStatus] || [];
    return allowedTargets.includes(nextStatus);
  }

  /**
   * Enforces transition controls with role-based administrative override paths
   */
  verifyTransitionContext(booking, nextStatus, actor) {
    const currentStatus = booking.bookingStatus;

    // 1. Core Graph Validation Path
    if (!this.canTransition(currentStatus, nextStatus)) {
      throw new ApiError(`Operational Conflict: Shifting booking state directly from "${currentStatus}" to "${nextStatus}" is invalid.`, 422);
    }

    // 2. Administrative Priority Branch
    if (actor.role === 'ADMIN') {
      return; // Admins possess absolute policy override authorization across all operational phases
    }

    // 3. Standard Multi-Tenant Role Gating Checks
    if (actor.role === 'PROVIDER') {
      if (booking.providerId && booking.providerId.toString() !== actor.userId.toString()) {
        throw new ApiError('Access Denied: You are not assigned to this booking profile.', 403);
      }
      if (nextStatus === BOOKING_STATUS.CANCELLED && currentStatus === BOOKING_STATUS.SERVICE_STARTED) {
        throw new ApiError('Policy Constraint: Providers cannot cancel active tasks once work has officially begun.', 400);
      }
    }

    if (actor.role === 'CUSTOMER') {
      if (booking.customerId.toString() !== actor.userId.toString()) {
        throw new ApiError('Access Denied: Resource ownership authentication failed.', 403);
      }
      if (nextStatus === BOOKING_STATUS.CANCELLED && 
          [BOOKING_STATUS.ARRIVED, BOOKING_STATUS.SERVICE_STARTED, BOOKING_STATUS.SERVICE_COMPLETED].includes(currentStatus)) {
        throw new ApiError('Policy Constraint: Customers cannot cancel a booking after the provider has arrived on-site.', 400);
      }
    }

    if (nextStatus === BOOKING_STATUS.COMPLETED && booking.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new ApiError('Financial Constraint: Booking cannot close without a settled PAID status.', 422);
    }
  }
}

module.exports = new BookingStateMachine();
