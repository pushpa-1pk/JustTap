const BookingService = require('../../services/booking/booking.service');
const ApiResponse = require('../../utils/api.response');
const ApiError = require('../../utils/api.error');

class BookingCustomerController {
  constructor() {
    this.bookingService = new BookingService();
  }

  create = async (req, res, next) => {
    try {
      const idempotencyKey = String(req.get('Idempotency-Key') || '').trim();
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
        throw new ApiError('A valid Idempotency-Key header is required to create a booking.', 400);
      }

      const actor = {
        userId: req.user.userId,
        role: req.user.role,
        phone: req.user.phone,
        accessToken: req.accessToken,
        idempotencyKey
      };

      // Pass req.validatedBody straight into the core domain service engine
      const booking = await this.bookingService.createBooking(actor, req.validatedBody);

      return ApiResponse.success(res, 201, 'Booking request submitted successfully.', booking);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BookingCustomerController;
