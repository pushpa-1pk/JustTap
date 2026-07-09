const DisputeMessageRepository = require('../../repositories/dispute-message.repository');
const BookingDisputeRepository = require('../../repositories/booking-dispute.repository');
const { DISPUTE_STATUS } = require('../../constants/dispute.constants');
const ApiError = require('../../utils/api.error');

class DisputeMessageService {
  constructor() {
    this.messageRepo = new DisputeMessageRepository();
    this.disputeRepo = new BookingDisputeRepository();
  }

  /**
   * Appends a message to a thread while enforcing communication blocks on resolved or closed cases
   */
  async postMessage(disputeId, actor, content, attachments = [], isInternalNote = false, session = null) {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new ApiError('Target dispute record unmapped or invalid.', 404);

    // Guard: Freeze the conversation thread if the case is already resolved or closed
    if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.disputeStatus)) {
      throw new ApiError('Communication Lockout: This dispute case file has been closed. New messages are blocked.', 400);
    }

    if (isInternalNote && actor.role !== 'ADMIN') {
      throw new ApiError('Access Denied: Internal coordination logs are restricted to administrators.', 403);
    }

    const messagePayload = {
      disputeId,
      sender: { userId: actor.userId, role: actor.role },
      messageContent: content,
      attachments,
      isInternalNote
    };

    return this.messageRepo.create(messagePayload, session);
  }

  async fetchConversationThread(disputeId, actor) {
    const includeInternalNotes = actor.role === 'ADMIN';
    return this.messageRepo.fetchThread(disputeId, includeInternalNotes);
  }
}

module.exports = DisputeMessageService;