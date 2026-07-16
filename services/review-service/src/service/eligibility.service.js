const reviewRepository = require('../repositories/review.repository');
const bookingClient = require('../clients/booking.client');
const ApiError = require('../utils/apiError');

class EligibilityService {
  /**
   * Evaluates the multi-tier validity of incoming customer feedback requests.
   */
  async verifySubmissionEligibility(customerId, bookingId, providerId, serviceId = null) {
    // 1. Verify that a review does not already exist for this bookingId
    const existingReview = await reviewRepository.findOne({ bookingId });
    if (existingReview) {
      throw new ApiError(403, 'Resource verification rule rejection: Feedback for this booking has already been submitted.');
    }

    const booking = await bookingClient.getBookingById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found for review eligibility.');
    }

    const allowedStatuses = new Set(['SERVICE_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'COMPLETED']);
    if (!allowedStatuses.has(String(booking.bookingStatus || '').toUpperCase())) {
      throw new ApiError(403, 'Reviews can only be submitted after a booking has been completed.');
    }

    if (String(booking.customerId) !== String(customerId)) {
      throw new ApiError(403, 'Only the booking customer can submit a review.');
    }

    if (String(booking.providerId) !== String(providerId)) {
      throw new ApiError(403, 'The selected provider does not match the booking record.');
    }

    if (serviceId && String(booking.serviceId) !== String(serviceId)) {
      throw new ApiError(403, 'The selected service does not match the booking record.');
    }
    
    return true;
  }
}

module.exports = new EligibilityService();
