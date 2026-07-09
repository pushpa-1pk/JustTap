const BookingService = require('../../services/booking/booking.service');
const ApiResponse = require('../../utils/api.response');

class BookingCustomerController {
  constructor() {
    this.bookingService = new BookingService();
  }

  create = async (req, res, next) => {
    try {
      const actor = {
        userId: req.user.userId,
        role: req.user.role,
        phone: req.user.phone,
        accessToken: req.accessToken
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
