const BaseRepository = require('./base.repository');
const DisputeMessage = require('../models/disputeMessage.model');

class DisputeMessageRepository extends BaseRepository {
  constructor() {
    super(DisputeMessage);
  }

  // Block modifications to maintain a tamper-proof conversation history
  async update() { throw new Error('Schema Violation: Dispute messages cannot be modified.'); }
  async softDelete() { throw new Error('Schema Violation: Dispute messages cannot be purged.'); }

  /**
   * Fetches conversation threads, filtering out internal notes for non-admin requests
   */
  async fetchThread(disputeId, includeInternalNotes = false) {
    const filter = { disputeId };
    if (!includeInternalNotes) {
      filter.isInternalNote = false;
    }
    return this.model.find(filter).sort({ createdAt: 1 }).lean();
  }
}

module.exports = DisputeMessageRepository;