const BaseRepository = require("./base.repository");
const Refund = require("../models/refund.model");

class RefundRepository extends BaseRepository {
  constructor() {
    super(Refund);
  }

  async findByIdempotencyKey(idempotencyKey, session = null) {
    return this.findOne({ idempotencyKey, deletedAt: null }, session);
  }
}

module.exports = new RefundRepository();