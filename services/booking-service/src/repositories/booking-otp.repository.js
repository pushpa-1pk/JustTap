const BaseRepository = require('./base.repository');
const BookingOTP = require('../models/bookingOTP.model');

class BookingOTPRepository extends BaseRepository {
  constructor() {
    super(BookingOTP);
  }

  /**
   * Upserts the active verification window constraints token for a booking [cite: 187]
   * @param {Object} otpData - Crypto hash target model parameter properties
   * @param {mongoose.ClientSession} [session=null] - Transaction workspace boundary session handle [cite: 183]
   */
  async upsertOTP(otpData, session = null) {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      { bookingId: otpData.bookingId },
      { $set: otpData },
      options
    );
  }

  /**
   * Atomically increments checking counts to protect endpoints from brute-force exploits [cite: 198]
   * @param {string} bookingId - Core asset key tracking reference string
   * @returns {Promise<Object|null>} Incremented tracking payload model metrics snapshot
   */
  async incrementAttempt(bookingId) {
    return this.model.findOneAndUpdate(
      { bookingId, verifiedAt: null },
      { $inc: { attemptCount: 1 } },
      { new: true, lean: false }
    );
  }

  /**
   * Flags confirmation properties and locks down validated tokens [cite: 198]
   * @param {string} bookingId - Shared tracking target field context identity key
   * @param {mongoose.ClientSession} [session=null] - Optional transaction scope context pointer [cite: 183]
   */
  async markAsVerified(bookingId, session = null) {
    const options = { new: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      { bookingId, verifiedAt: null },
      { $set: { verifiedAt: new Date() } },
      options
    );
  }

  /**
   * Checks for an active, unexpired verification challenge token mapped to a request
   * @param {string} bookingId - Target entity identifier
   */
  async findActiveOTP(bookingId) {
    return this.model.findOne({ 
      bookingId, 
      verifiedAt: null,
      expiresAt: { $gt: new Date() }
    }).lean();
  }
}

module.exports = BookingOTPRepository;