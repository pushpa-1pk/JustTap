const BookingRepository = require('../repositories/booking.repository');
const ApiError = require('../utils/api.error');

const ownershipMiddleware = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const { userId, role } = req.user;
    
    const bookingRepo = new BookingRepository();
    const booking = await bookingRepo.findById(bookingId);

    if (!booking) {
      return next(new ApiError('Target booking instance unmapped or invalid.', 404));
    }

    // Admins bypass standard tenant isolation constraints automatically
    if (role === 'ADMIN') {
      req.bookingContext = booking; // Pass the fetched entity along to optimize database round-trips
      return next();
    }

    const isCustomerOwner = role === 'CUSTOMER' && booking.customerId.toString() === userId.toString();
    const isAssignedProvider = role === 'PROVIDER' && booking.providerId && booking.providerId.toString() === userId.toString();

    if (!isCustomerOwner && !isAssignedProvider) {
      return next(new ApiError('Access Denied: You do not own or have assignment rights to this booking record.', 403));
    }

    req.bookingContext = booking;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = ownershipMiddleware;