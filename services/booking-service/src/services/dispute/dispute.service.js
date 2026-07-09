const BookingRepository = require('../../repositories/booking.repository');
const BookingDisputeRepository = require('../../repositories/booking-dispute.repository');
const DisputePolicyService = require('./dispute-policy.service');
const DisputeResolutionPolicyService = require('./dispute-resolution-policy.service');
const DisputeMessageService = require('./dispute-message.service');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const crypto = require('crypto');
const ApiError = require('../../utils/api.error');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { DISPUTE_STATUS, DISPUTE_PRIORITY } = require('../../constants/dispute.constants');
const { BOOKING_EVENTS } = require('../../constants/event.constants');

class DisputeService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.disputeRepo = new BookingDisputeRepository();
    this.policyService = new DisputePolicyService();
    this.resolutionPolicy = new DisputeResolutionPolicyService();
    this.messageService = new DisputeMessageService();
    this.timelineService = new BookingTimelineService();
    this.eventService = new BookingEventService();
  }

  _generateDisputeNumber() {
    return `DIS-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }

  async raiseDispute(bookingId, actor, dto, session = null) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new ApiError('Target booking record unmapped or invalid.', 404);

    this.policyService.validateDisputeEligibility(booking);

    const existingDispute = await this.disputeRepo.findByBookingId(bookingId);
    if (existingDispute) throw new ApiError('Conflict Error: This booking already has an active dispute file.', 409);

    const disputeNumber = this._generateDisputeNumber();

    const disputePayload = {
      disputeNumber,
      bookingId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      reasonCategory: dto.reasonCategory,
      description: dto.description,
      evidence: (dto.evidence || []).map(item => ({
        url: item.url,
        type: item.type,
        uploadedBy: actor.role,
        createdAt: new Date()
      })),
      disputeStatus: DISPUTE_STATUS.OPEN,
      priorityLevel: dto.priorityLevel || DISPUTE_PRIORITY.MEDIUM
    };

    const dispute = await this.disputeRepo.create(disputePayload, session);

    await this.bookingRepo.updateStatus(bookingId, booking.bookingStatus, BOOKING_STATUS.DISPUTED, session);

    await this.timelineService.logTransition({
      booking,
      fromStatus: booking.bookingStatus,
      toStatus: BOOKING_STATUS.DISPUTED,
      actor,
      metadata: { disputeNumber, reasonCategory: dto.reasonCategory },
      session
    });

    await this.eventService.dispatchEvent(
      bookingId,
      BOOKING_EVENTS.DISPUTE_CREATED || 'DISPUTE_CREATED',
      { disputeId: dispute._id, disputeNumber, raisedBy: actor.role, reasonCategory: dto.reasonCategory },
      session
    );

    return dispute;
  }

  /**
   * Processes case review files and issues target updates safely using our resolution policies
   */
  async resolveDispute(disputeId, adminActor, resolutionDto, session = null) {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new ApiError('Target dispute case unmapped or invalid.', 404);

    const booking = await this.bookingRepo.findById(dispute.bookingId);
    if (!booking) throw new ApiError('Target booking master document unmapped or invalid.', 404);

    if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.disputeStatus)) {
      throw new ApiError('Policy Error: This dispute case file has already reached resolution status.', 400);
    }

    // 1. Delegate business mapping rules to our resolution policy service
    const targetBookingStatus = this.resolutionPolicy.determineTargetBookingStatus(resolutionDto.resolutionType);
    const financialSplits = this.resolutionPolicy.calculatePayoutSplits(
      booking.snapshotPricing.totalAmountToPay,
      resolutionDto.resolutionType,
      resolutionDto
    );

    // 2. Persist administrative updates to the Dispute document
    const disputeUpdate = {
      disputeStatus: DISPUTE_STATUS.RESOLVED,
      adminRemarks: resolutionDto.adminRemarks,
      resolutionDetails: {
        resolutionType: resolutionDto.resolutionType,
        resolvedBy: adminActor.userId,
        resolvedAt: new Date()
      }
    };
    await this.disputeRepo.update(disputeId, disputeUpdate, session);

    // 3. Update the primary booking status atomically
    const updatedBooking = await this.bookingRepo.updateStatus(dispute.bookingId, BOOKING_STATUS.DISPUTED, targetBookingStatus, session);
    await this.bookingRepo.update(dispute.bookingId, { paymentStatus: financialSplits.targetPaymentStatus }, session);

    // 4. Log the resolution to our timeline, passing the complete booking document
    await this.timelineService.logTransition({
      booking: updatedBooking, // Fixed: Passed full document mapping context
      fromStatus: BOOKING_STATUS.DISPUTED,
      toStatus: targetBookingStatus,
      actor: adminActor,
      metadata: { 
        resolutionType: resolutionDto.resolutionType, 
        caseId: dispute.disputeNumber // Fixed Bug: Replaced undefined variable with case snapshot reference
      },
      session
    });

    // 5. Dispatch discrete outbox messages rather than generic completion blocks
    await this.eventService.dispatchEvent(
      dispute.bookingId,
      BOOKING_EVENTS.DISPUTE_RESOLVED || 'DISPUTE_RESOLVED',
      {
        disputeId: dispute._id,
        disputeNumber: dispute.disputeNumber,
        resolutionType: resolutionDto.resolutionType,
        paymentRecommendations: {
          refundCustomerAmount: financialSplits.refundCustomerAmount,
          payoutProviderAmount: financialSplits.payoutProviderAmount,
          targetPaymentStatus: financialSplits.targetPaymentStatus
        }
      },
      session
    );

    return { disputeId, disputeNumber: dispute.disputeNumber, resolutionStatus: DISPUTE_STATUS.RESOLVED };
  }
}

module.exports = DisputeService;
