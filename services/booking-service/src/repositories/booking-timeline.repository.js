const BaseRepository = require('./base.repository');
const BookingTimeline = require('../models/bookingTimeline.model');

class BookingTimelineRepository extends BaseRepository {
  constructor() {
    super(BookingTimeline);
  }

  // Enforce append-only constraints by blocking all modification methods 
  async update() { 
    throw new Error('System Security Exception: Modification operations are blocked on the immutable timeline registry.'); 
  }
  
  async softDelete() { 
    throw new Error('System Security Exception: Document purges are blocked on the immutable timeline registry.'); 
  }

  /**
   * Appends an operational lifecycle history entry to the tracking timeline [cite: 551]
   * @param {Object} timelineData - Standard transaction parameters dict mapping
   * @param {mongoose.ClientSession} [session=null] - Active session boundary transaction pointer [cite: 183]
   * @returns {Promise<mongoose.Document>} Formatted timeline document instance [cite: 204]
   */
  async append(timelineData, session = null) {
    return this.create(timelineData, session);
  }

  /**
   * Resolves the complete audit trail history path for an order
   * @param {string} bookingId - Core booking master tracking identifier key
   */
  async fetchChronologicalHistory(bookingId) {
    return this.model.find({ bookingId }).sort({ createdAt: 1 }).lean();
  }
}

module.exports = BookingTimelineRepository;