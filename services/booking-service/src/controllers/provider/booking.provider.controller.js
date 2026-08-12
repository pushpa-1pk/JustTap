const BookingService = require('../../services/booking/booking.service');
const ApiResponse = require('../../utils/api.response');

class BookingProviderController {
  constructor() {
    this.bookingService = new BookingService();
  }

  accept = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const actor = { userId: req.user.userId, role: req.user.role };

      const booking = await this.bookingService.acceptBooking(bookingId, actor);
      return ApiResponse.success(res, 200, 'Job assignment locked and confirmed successfully.', booking);
    } catch (error) {
      next(error);
    }
  };

  advance = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const actor = { userId: req.user.userId, role: req.user.role };

      const booking = await this.bookingService.advanceStatus(bookingId, req.validatedBody.nextStatus, actor);
      return ApiResponse.success(res, 200, `Booking status successfully advanced to ${req.validatedBody.nextStatus}.`, booking);
    } catch (error) {
      next(error);
    }
  };

  verifyHandshake = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const actor = { userId: req.user.userId, role: req.user.role };
      const { rawOtp, purpose, completionPhotos } = req.validatedBody;

      const booking = await this.bookingService.verifyServiceHandshake(bookingId, rawOtp, purpose, actor, completionPhotos);
      return ApiResponse.success(res, 200, 'Handshake token validated. Status updated successfully.', booking);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BookingProviderController;