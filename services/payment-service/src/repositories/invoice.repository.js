const BaseRepository = require("./base.repository");
const Invoice = require("../models/invoice.model");

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async findByBookingAndType(bookingId, type, session = null) {
    return this.findOne({ bookingId, type, deletedAt: null }, session);
  }
}

module.exports = new InvoiceRepository();