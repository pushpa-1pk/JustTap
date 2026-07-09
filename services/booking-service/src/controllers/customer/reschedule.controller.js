const { withTransaction } = require('../../helpers/transaction.helper');
const RescheduleService = require('../../services/reschedule/reschedule.service');
const ApiResponse = require('../../utils/api.response');

class RescheduleController {
  constructor() {
    this.rescheduleService = new RescheduleService();
  }

  /**
   * Route handler for executing rescheduling actions
   * Route: POST /api/v1/bookings/:id/reschedule
   */
  reschedule = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const actor = { userId: req.user.userId, role: req.user.role };

      const result = await withTransaction(async (session) => {
        return this.rescheduleService.executeReschedule(
          bookingId,
          actor,
          req.validatedBody,
          session
        );
      });

      return ApiResponse.success(res, 200, 'Booking schedule has been updated successfully.', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RescheduleController;