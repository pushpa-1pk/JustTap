const BaseRepository = require("./base.repository");
const PaymentOrder = require("../models/paymentOrder.model");

class PaymentOrderRepository extends BaseRepository {
  constructor() {
    super(PaymentOrder);
  }

  async findByGatewayOrderId(gatewayOrderId, session = null) {
    return this.findOne({ gatewayOrderId }, session);
  }

  async findPendingByBookingId(bookingId, session = null) {
    return this.findOne({ bookingId, status: "PENDING" }, session);
  }

  /**
   * Executed an encapsulated atomic check-and-mutation boundary transition gating rules
   * @param {string} gatewayOrderId Gateway unique payment index identification string
   * @param {string} targetStatus Destination state matrix indicator
   * @param {ClientSession} session Active MongoDB ACID transaction context proxy
   * @returns {Promise<Object|null>} Mutated document block or null if condition failed
   */
  async advanceStateAtomic(gatewayOrderId, targetStatus, session = null) {
    // Only allow state progression if the current database state is explicitly PENDING
    return this.model.findOneAndUpdate(
      { 
        gatewayOrderId, 
        status: "PENDING" 
      },
      { 
        $set: { status: targetStatus },
        $inc: { attempts: 1 }
      },
      { new: true, session }
    );
  }
}

module.exports = new PaymentOrderRepository();
