const BaseRepository = require('./base.repository');
const BookingCancellation = require('../models/bookingCancellation.model');

class BookingCancellationRepository extends BaseRepository {
  constructor() {
    super(BookingCancellation);
  }

  async findByBookingId(bookingId) {
    return this.findOne({ bookingId });
  }
}

module.exports = BookingCancellationRepository;
