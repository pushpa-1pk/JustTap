const ProviderQueryService = require('../../services/booking/queries/provider-query.service');
const BookingQueryService = require('../../services/booking/booking-query.service');
const ApiResponse = require('../../utils/api.response');

class ProviderBookingQueryController {
  constructor() {
    this.providerQueryService = new ProviderQueryService();
    this.bookingQueryService = new BookingQueryService();
  }

  getPendingAssignments = async (req, res, next) => {
    try {
      const result = await this.providerQueryService.getPendingRequests(req.user.userId);
      return ApiResponse.success(res, 200, 'Pending booking assignments retrieved.', result);
    } catch (error) {
      next(error);
    }
  };

  listCurrentJobs = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.providerQueryService.getActiveJobs(req.user.userId, page, limit);
      return ApiResponse.success(res, 200, 'Active provider bookings retrieved.', result);
    } catch (error) {
      next(error);
    }
  };

  listPastLogs = async (req, res, next) => {
    try {
      const { page, limit, status, search } = req.query;
      const result = await this.providerQueryService.getHistoryLog(req.user.userId, { page, limit, status, search });
      return ApiResponse.success(res, 200, 'Provider booking history retrieved.', result);
    } catch (error) {
      next(error);
    }
  };

  getJobDetails = async (req, res, next) => {
    try {
      const actor = { userId: req.user.userId, role: req.user.role };
      const result = await this.bookingQueryService.getBookingDetails(req.params.id, actor);
      return ApiResponse.success(res, 200, 'Provider booking details retrieved.', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProviderBookingQueryController;
