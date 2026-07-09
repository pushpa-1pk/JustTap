const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');

class BookingValidationService {
  /**
   * Enforces future booking scheduling constraints
   */
  validateSchedulingWindow(startTime, endTime) {
    const now = new Date();
    const minLeadTimeBufferMs = 15 * 60 * 1000; 

    if (new Date(startTime).getTime() < now.getTime() + minLeadTimeBufferMs) {
      throw new ApiError('Scheduling Exception: Bookings must be reserved at least 15 minutes in advance.', 400);
    }

    const startHour = new Date(startTime).getHours();
    if (startHour < 6 || startHour > 23) {
      throw new ApiError('Scheduling Exception: Bookings can only be scheduled within standard operation hours (06:00 AM - 11:00 PM).', 422);
    }
  }

  /**
   * Validates rescheduling attempts against platform limit policies
   */
  validateRescheduleRules(booking, maxRescheduleThreshold = 3) {
    if (booking.bookingStatus !== BOOKING_STATUS.PROVIDER_ACCEPTED) {
      throw new ApiError('Reschedule Rejected: Booking appointments can only be adjusted after provider acceptance.', 422);
    }
    if (booking.rescheduleCount >= maxRescheduleThreshold) {
      throw new ApiError(`Reschedule Rejected: This booking has reached the maximum allowance of ${maxRescheduleThreshold} updates.`, 422);
    }
  }
}

module.exports = new BookingValidationService();