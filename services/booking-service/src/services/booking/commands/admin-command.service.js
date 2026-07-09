const { withTransaction } = require('../../../helpers/transaction.helper');
const BookingRepository = require('../../../repositories/booking.repository');
const BookingStateMachine = require('../booking-state-machine');
const BookingTimelineService = require('../../timeline/booking-timeline.service');
const BookingEventService = require('../../event/booking-event.service');
const DisputeService = require('../../dispute/dispute.service');
const ApiError = require('../../../utils/api.error');
const { BOOKING_STATUS } = require('../../../constants/booking-status');
const { BOOKING_EVENTS } = require('../../../constants/event.constants');

class AdminCommandService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.timelineService = new BookingTimelineService();
    this.eventService = new BookingEventService();
    this.disputeService = new DisputeService();
  }

  /**
   * Manually assigns a provider to a booking, bypassing the automated matching loops during support overrides
   */
  async forceAssignProvider(bookingId, adminActor, providerSnapshotPayload) {
    return withTransaction(async (session) => {
      const booking = await this.bookingRepo.findById(bookingId);
      if (!booking) throw new ApiError('Target booking not found.', 404);

      const updatedBooking = await this.bookingRepo.model.findOneAndUpdate(
        { _id: bookingId, deletedAt: null },
        {
          $set: {
            providerId: providerSnapshotPayload.providerId,
            providerSnapshot: {
              businessName: providerSnapshotPayload.businessName,
              phone: providerSnapshotPayload.phone
            },
            bookingStatus: BOOKING_STATUS.PROVIDER_ACCEPTED,
            acceptedAt: new Date()
          }
        },
        { new: true, session }
      );

      await this.timelineService.logTransition({
        booking: updatedBooking,
        fromStatus: booking.bookingStatus,
        toStatus: BOOKING_STATUS.PROVIDER_ACCEPTED,
        actor: adminActor,
        metadata: { strategy: 'FORCE_ADMIN_ASSIGNMENT', manualProviderId: providerSnapshotPayload.providerId },
        session
      });

      await this.eventService.dispatchEvent(
        bookingId,
        BOOKING_EVENTS.ACCEPTED,
        { bookingNumber: booking.bookingNumber, providerId: providerSnapshotPayload.providerId, manualOverride: true },
        session
      );

      return updatedBooking;
    });
  }

  /**
   * Standardized entry point allowing administrators to resolve disputes
   */
  async resolveDisputeCase(disputeId, adminActor, resolutionDto) {
    return withTransaction(async (session) => {
      return this.disputeService.resolveDispute(disputeId, adminActor, resolutionDto, session);
    });
  }
}

module.exports = AdminCommandService;