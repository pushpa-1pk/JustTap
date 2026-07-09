const BookingDisputeRepository = require('../../repositories/booking-dispute.repository');
const ApiError = require('../../utils/api.error');

class DisputeEvidenceService {
  constructor() {
    this.disputeRepo = new BookingDisputeRepository();
  }

  /**
   * Appends full-identity attachments to an active dispute for strict auditing
   */
  async attachEvidence(disputeId, evidenceArray, actor, session = null) {
    const formattedEvidence = evidenceArray.map(item => ({
      url: item.url,
      type: item.type,
      uploadedBy: {
        userId: actor.userId,
        role: actor.role // Enhanced audit trace capturing complete identity signatures
      },
      createdAt: new Date()
    }));

    const options = session ? { session, new: true } : { new: true };
    const updatedDispute = await this.disputeRepo.model.findByIdAndUpdate(
      disputeId,
      { $push: { evidence: { $each: formattedEvidence } } },
      options
    );

    if (!updatedDispute) throw new ApiError('Target dispute unmapped or invalid.', 404);
    return updatedDispute;
  }
}

module.exports = DisputeEvidenceService;