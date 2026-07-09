const BaseRepository = require('./base.repository');
const BookingDispute = require('../models/bookingDispute.model');

class BookingDisputeRepository extends BaseRepository {
  constructor() {
    super(BookingDispute);
  }

  async findByDisputeNumber(disputeNumber) {
    return this.findOne({ disputeNumber });
  }

  async findByBookingId(bookingId) {
    return this.findOne({ bookingId });
  }
}

module.exports = BookingDisputeRepository;