const BaseRepository = require("./base.repository");
const PaymentEvent = require("../models/paymentEvent.model");

class PaymentEventRepository extends BaseRepository {
  constructor() {
    super(PaymentEvent);
  }

  async checkEventExists(gatewayEventId, session = null) {
    if (!gatewayEventId) return false;
    const count = await this.model.countDocuments({ gatewayEventId }).session(session);
    return count > 0;
  }
}

module.exports = new PaymentEventRepository();