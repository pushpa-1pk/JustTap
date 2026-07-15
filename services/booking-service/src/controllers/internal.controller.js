const ApiResponse = require('../utils/api.response');
const internalMatchingService = require('../services/booking/internal-matching.service');

class InternalController {
  getBooking = async (req, res, next) => {
    try {
      const booking = await internalMatchingService.getBookingById(req.params.id);
      return ApiResponse.success(res, 200, 'Booking retrieved successfully.', booking);
    } catch (error) {
      next(error);
    }
  };

  startMatchingRequest = async (req, res, next) => {
    try {
      const booking = await internalMatchingService.startMatchingRequest(
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, 200, 'Booking matching request started successfully.', booking);
    } catch (error) {
      next(error);
    }
  };

  acceptMatchingRequest = async (req, res, next) => {
    try {
      const booking = await internalMatchingService.acceptMatchingRequest(
        req.params.id,
        req.body.providerId
      );
      return ApiResponse.success(res, 200, 'Booking matching request accepted successfully.', booking);
    } catch (error) {
      next(error);
    }
  };

  rejectMatchingRequest = async (req, res, next) => {
    try {
      const booking = await internalMatchingService.rejectMatchingRequest(
        req.params.id,
        req.body.fallbackCandidateProvider || null
      );
      return ApiResponse.success(res, 200, 'Booking matching request updated successfully.', booking);
    } catch (error) {
      next(error);
    }
  };

  verifyTrackingAccess = async (req, res, next) => {
    try {
      const result = await internalMatchingService.verifyTrackingAccess(
        req.params.id,
        req.body.userId,
        req.body.role
      );
      return ApiResponse.success(res, 200, 'Tracking access verified successfully.', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = InternalController;
