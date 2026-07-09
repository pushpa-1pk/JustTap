const BaseRepository = require('./base.repository');
const BookingEvent = require('../models/bookingEvent.model');

class BookingEventRepository extends BaseRepository {
  constructor() {
    super(BookingEvent);
  }

  /**
   * Enqueues a message payload within an active multi-document transaction block 
   * @param {Object} eventPayload - Dict defining the event category parameters and context fields [cite: 131]
   * @param {mongoose.ClientSession} [session=null] - Associated active workspace transaction session handle [cite: 183]
   */
  async queueEvent(eventPayload, session = null) {
    return this.create(eventPayload, session);
  }

  /**
   * Polls un-broadcasted data payloads chronologically to pass to background publishers
   * @param {number} [batchSize=50] - Maximum threshold processing slice window width
   */
  async fetchUnpublishedBatch(batchSize = 50) {
    return this.model.find({ published: false })
      .sort({ createdAt: 1 })
      .limit(batchSize)
      .lean();
  }

  /**
   * Tracks broker transaction errors or increments retry variables after evaluating limits [cite: 200, 201]
   * @param {string} eventId - Unique primary key mapping identifier string
   * @param {number} maxRetryThreshold - Absolute safety limit configuration boundary [cite: 200, 201]
   */
  async incrementRetry(eventId, maxRetryThreshold) {
    return this.model.findOneAndUpdate(
      { 
        _id: eventId, 
        retryCount: { $lt: maxRetryThreshold }, 
        published: false 
      },
      { $inc: { retryCount: 1 } },
      { new: true }
    );
  }

  /**
   * Completes outbox cycle traces and flags successful broker handshakes
   * @param {string} eventId - Target tracking document identifier
   */
  async markAsPublished(eventId) {
    return this.model.findByIdAndUpdate(
      eventId,
      { 
        $set: { 
          published: true, 
          publishedAt: new Date() 
        } 
      },
      { new: true }
    );
  }
}

module.exports = BookingEventRepository;