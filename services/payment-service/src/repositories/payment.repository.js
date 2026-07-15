const BaseRepository = require("./base.repository");
const Payment = require("../models/payment.model");

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByGatewayPaymentId(gatewayPaymentId, session = null) {
    return this.findOne({ gatewayPaymentId }, session);
  }

  async findByBookingId(bookingId, session = null) {
    return this.findOne({ bookingId }, session);
  }
}

module.exports = new PaymentRepository();