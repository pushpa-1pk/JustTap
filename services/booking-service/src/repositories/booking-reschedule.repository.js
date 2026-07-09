const BaseRepository = require('./base.repository');
const BookingReschedule = require('../models/bookingReschedule.model');

class BookingRescheduleRepository extends BaseRepository {
  constructor() {
    super(BookingReschedule);
  }

  /**
   * Retrieves the historical reschedule logs mapped to a unique booking ID
   * @param {string} bookingId - Core booking master tracking key
   * @returns {Promise<Array<Object>>} Lean document array list
   */
  async findHistory(bookingId) {
    return this.find({ bookingId }, null, { createdAt: -1 });
  }

  /**
   * Checks if an active pending reschedule negotiation window exists
   * @param {string} bookingId - Core booking primary key
   * @returns {Promise<boolean>} True if a pending proposal is open
   */
  async existsPending(bookingId) {
    return this.exists({ bookingId, approvalStatus: 'PENDING' });
  }
}

module.exports = BookingRescheduleRepository;