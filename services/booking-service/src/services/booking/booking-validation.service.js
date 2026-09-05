const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');

class BookingValidationService {
  /**
   * Enforces future booking scheduling constraints
   */
  validateSchedulingWindow(startTime, endTime, bookingType = 'INSTANT') {
    const now = new Date();
    // Instant bookings are created in real time with immediate dispatch
    const minLeadTimeBufferMs = bookingType === 'INSTANT' ? -60000 : 15 * 60 * 1000; 

    if (new Date(startTime).getTime() < now.getTime() + minLeadTimeBufferMs) {
      throw new ApiError('Scheduling Exception: Bookings must be scheduled in advance.', 400);
    }

    // Convert to Indian Standard Time (IST / Asia/Kolkata, UTC+5:30)
    // to prevent UTC cloud servers (e.g. Render) from rejecting morning/daytime bookings
    const istTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    }).format(new Date(startTime));

    const startHour = parseInt(istTimeStr, 10);
    if (startHour < 6 || startHour >= 23) {
      throw new ApiError('Scheduling Exception: Bookings can only be scheduled within standard operation hours (06:00 AM - 11:00 PM IST).', 422);
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