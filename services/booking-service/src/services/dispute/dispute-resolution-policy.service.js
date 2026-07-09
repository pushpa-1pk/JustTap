const { BOOKING_STATUS } = require('../../constants/booking-status');
const { PAYMENT_STATUS } = require('../../constants/payment-status');
const { DISPUTE_RESOLUTION_TYPES } = require('../../constants/dispute.constants');
const ApiError = require('../../utils/api.error');

class DisputeResolutionPolicyService {
  /**
   * Maps an admin resolution choice to the corresponding target Booking state
   * @param {string} resolutionType - Selected resolution enum string
   * @returns {string} The target BOOKING_STATUS state constant
   */
  determineTargetBookingStatus(resolutionType) {
    switch (resolutionType) {
      case DISPUTE_RESOLUTION_TYPES.PAY_PROVIDER:
      case DISPUTE_RESOLUTION_TYPES.NO_ACTION:
        return BOOKING_STATUS.COMPLETED;

      case DISPUTE_RESOLUTION_TYPES.FULL_REFUND:
        return BOOKING_STATUS.FAILED;

      case DISPUTE_RESOLUTION_TYPES.PARTIAL_REFUND:
      case DISPUTE_RESOLUTION_TYPES.GOODWILL_COMPENSATION:
        return BOOKING_STATUS.COMPLETED;

      case DISPUTE_RESOLUTION_TYPES.REWORK:
        return BOOKING_STATUS.SERVICE_STARTED; // Restarts the lifecycle path

      case DISPUTE_RESOLUTION_TYPES.WARNING:
      case DISPUTE_RESOLUTION_TYPES.SUSPEND_PROVIDER:
      case DISPUTE_RESOLUTION_TYPES.ACCOUNT_BLOCK:
        return BOOKING_STATUS.FAILED;

      default:
        throw new ApiError(`Policy Exception: The resolution type "${resolutionType}" is unmapped to a target booking status.`, 422);
    }
  }

  /**
   * Computes the financial split based on an administrative resolution decision
   */
  calculatePayoutSplits(totalPaid, resolutionType, adminInputs = {}) {
    let refundCustomerAmount = 0;
    let payoutProviderAmount = totalPaid;
    let targetPaymentStatus = PAYMENT_STATUS.RELEASED;

    switch (resolutionType) {
      case DISPUTE_RESOLUTION_TYPES.FULL_REFUND:
        refundCustomerAmount = totalPaid;
        payoutProviderAmount = 0;
        targetPaymentStatus = PAYMENT_STATUS.REFUNDED;
        break;

      case DISPUTE_RESOLUTION_TYPES.PARTIAL_REFUND:
        refundCustomerAmount = adminInputs.refundCustomerAmount || Math.round(totalPaid * 0.5);
        payoutProviderAmount = Math.max(0, totalPaid - refundCustomerAmount);
        targetPaymentStatus = PAYMENT_STATUS.PARTIAL_REFUNDED;
        break;

      case DISPUTE_RESOLUTION_TYPES.PAY_PROVIDER:
      case DISPUTE_RESOLUTION_TYPES.NO_ACTION:
        refundCustomerAmount = 0;
        payoutProviderAmount = totalPaid;
        targetPaymentStatus = PAYMENT_STATUS.RELEASED;
        break;

      case DISPUTE_RESOLUTION_TYPES.REWORK:
        refundCustomerAmount = 0;
        payoutProviderAmount = 0; // Held in processing until rework completion verification
        targetPaymentStatus = PAYMENT_STATUS.PROCESSING;
        break;

      default:
        refundCustomerAmount = 0;
        payoutProviderAmount = 0;
        targetPaymentStatus = PAYMENT_STATUS.FAILED;
    }

    return {
      refundCustomerAmount,
      payoutProviderAmount,
      targetPaymentStatus
    };
  }
}

module.exports = DisputeResolutionPolicyService;