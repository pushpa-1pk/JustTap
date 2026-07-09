const { withTransaction } = require('../../helpers/transaction.helper');
const CancellationService = require('../../services/cancellation/cancellation.service');
const ApiResponse = require('../../utils/api.response');

class CancellationController {
  constructor() {
    this.cancellationService = new CancellationService();
  }

  /**
   * Public endpoint route handler for submitting cancellation requests
   * Route: POST /api/v1/bookings/:id/cancel
   */
  cancel = async (req, res, next) => {
    try {
      const { id: bookingId } = req.params;
      const { reasonCode, customExplanation } = req.validatedBody;
      const actor = { userId: req.user.userId, role: req.user.role };

      const result = await withTransaction(async (session) => {
        return this.cancellationService.executeCancellation(
          bookingId,
          actor,
          reasonCode,
          customExplanation,
          session
        );
      });

      return ApiResponse.success(res, 200, 'Booking has been successfully processed and cancelled.', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CancellationController;