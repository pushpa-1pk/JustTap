const { BOOKING_STATUS } = require('../../constants/booking-status');
const { CANCELLATION_POLICIES, REFUND_STATUS } = require('../../constants/cancellation.constants');

class CancellationPolicyService {
  /**
   * Computes the financial splits and penalty deductions for a canceled booking
   */
  calculateFinancials(booking, role) {
    const totalAmountPaid = booking.snapshotPricing.totalAmountToPay;
    let penaltyApplied = 0;
    let platformLoss = 0;
    let rawRefundAmount = totalAmountPaid;

    if (role === 'CUSTOMER') {
      if (booking.bookingStatus === BOOKING_STATUS.PROVIDER_ACCEPTED || booking.bookingStatus === BOOKING_STATUS.ON_THE_WAY) {
        penaltyApplied = CANCELLATION_POLICIES.CUSTOMER_PENALTY_AFTER_ACCEPT;
        rawRefundAmount = Math.max(0, totalAmountPaid - penaltyApplied);
      }
    } else if (role === 'PROVIDER') {
      if (booking.bookingStatus === BOOKING_STATUS.ON_THE_WAY) {
        penaltyApplied = CANCELLATION_POLICIES.PROVIDER_PENALTY_ON_THE_WAY;
        rawRefundAmount = totalAmountPaid; // Customer is fully refunded
        platformLoss = 0;
      }
    } else if (role === 'ADMIN') {
      penaltyApplied = 0;
      rawRefundAmount = totalAmountPaid; // Administrative interventions trigger full clean refunds
    }

    const refundProcessedAmount = Math.max(0, rawRefundAmount);

    return {
      penaltyApplied,
      refundProcessedAmount,
      // Refactored to leverage explicit enums instead of raw string inputs
      refundStatus: refundProcessedAmount > 0 ? REFUND_STATUS.PROCESSING : REFUND_STATUS.NONE,
      platformLoss
    };
  }
}

module.exports = CancellationPolicyService;