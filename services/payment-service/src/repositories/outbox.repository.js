const BaseRepository = require("./base.repository");
const OutboxEvent = require("../models/outboxEvent.model");
const AggregateSequence = require("../models/aggregateSequence.model");

class OutboxRepository extends BaseRepository {
  constructor() {
    super(OutboxEvent);
  }

  /**
   * Atomic sequence generator that bypasses read-then-write race condition blocks completely
   * @param {ObjectId} aggregateId Aggregate target identifier
   * @param {string} aggregateType Aggregate string label
   * @param {ClientSession} session Active MongoDB multi-document transaction handle
   * @returns {Promise<number>} The atomically generated, unique sequential identifier number
   */
  async getNextSequenceAtomic(aggregateId, aggregateType, session = null) {
    const sequenceDoc = await AggregateSequence.findOneAndUpdate(
      { aggregateId },
      { 
        $inc: { currentSequence: 1 },
        $setOnInsert: { aggregateType }
      },
      { upsert: true, new: true, session }
    );
    return sequenceDoc.currentSequence;
  }

  async fetchClaimableBatch(limit, session = null) {
    return this.model.find({
      status: "PENDING",
      nextRetryAt: { $lte: new Date() }
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit)
      .session(session);
  }

  async queueDomainEvent(event, session = null) {
    const sequenceNumber = await this.getNextSequenceAtomic(
      event.aggregateId,
      event.aggregateType,
      session
    );

    return this.create({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      schemaVersion: event.schemaVersion || 1,
      sequenceNumber,
      status: "PENDING",
      attempts: 0,
      correlationId: event.correlationId,
      nextRetryAt: new Date()
    }, session);
  }

  async lockEventForWorker(eventId, workerId, session = null) {
    return this.model.findOneAndUpdate(
      { _id: eventId, status: "PENDING" },
      { 
        $set: { 
          status: "PROCESSING", 
          workerId, 
          lockedAt: new Date() 
        },
        $inc: { attempts: 1 }
      },
      { new: true, session }
    );
  }

  async releaseFailedEvent(eventId, errorStack, backoffWindowMs) {
    const event = await this.findById(eventId);
    if (!event) return;

    const isTerminalFailure = event.attempts >= 5;
    const targetStatus = isTerminalFailure ? "FAILED" : "PENDING";
    const nextRetry = new Date(Date.now() + backoffWindowMs);

    return this.model.findByIdAndUpdate(
      eventId,
      {
        $set: {
          status: targetStatus,
          errorTrace: errorStack,
          workerId: null,
          lockedAt: null,
          nextRetryAt: nextRetry
        }
      },
      { new: true }
    );
  }

  /**
   * P1 Core Recovery: Recalibrates zombie processing loops left stranded by container crashes
   */
  async reclaimZombieLocks(stalenessThresholdMs) {
    const cutOffTime = new Date(Date.now() - stalenessThresholdMs);
    return this.model.updateMany(
      {
        status: "PROCESSING",
        lockedAt: { $lte: cutOffTime }
      },
      {
        $set: {
          status: "PENDING",
          workerId: null,
          lockedAt: null,
          nextRetryAt: new Date(Date.now() + 5000) // Impose a slight delay before retry
        }
      }
    );
  }
}

module.exports = new OutboxRepository();
