const BaseRepository = require("./base.repository");
const Withdrawal = require("../models/withdrawal.model");

class WithdrawalRepository extends BaseRepository {
  constructor() {
    super(Withdrawal);
  }

  async findPendingWithdrawals(providerId, session = null) {
    return this.model.find({ providerId, status: "REQUESTED", deletedAt: null }).session(session);
  }
}

module.exports = new WithdrawalRepository();