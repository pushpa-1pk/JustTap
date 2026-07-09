const BookingQueryService = require('../../services/booking/booking-query.service');
const ApiResponse = require('../../utils/api.response');

class BookingQueryController {
  constructor() {
    this.queryService = new BookingQueryService();
  }

  /**
   * GET /api/v1/bookings/customer/history
   */
  listHistory = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.queryService.getCustomerHistory(req.user.userId, page, limit);
      return ApiResponse.success(res, 200, 'Customer history retrieved.', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/bookings/customer/:id
   */
  getDetails = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const actor = { userId: req.user.userId, role: req.user.role };
      
      const booking = await this.queryService.getBookingDetails(bookingId, actor);
      return ApiResponse.success(res, 200, 'Booking details retrieved.', booking);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/bookings/customer/:id/timeline
   */
  getTimeline = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const history = await this.queryService.getBookingTimeline(bookingId);
      return ApiResponse.success(res, 200, 'Chronological timeline logs retrieved.', history);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BookingQueryController;