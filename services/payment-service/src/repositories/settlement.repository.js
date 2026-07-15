const BaseRepository = require("./base.repository");
const Settlement = require("../models/settlement.model");

class SettlementRepository extends BaseRepository {
  constructor() {
    super(Settlement);
  }

  async findByPaymentId(paymentId, session = null) {
    return this.findOne({ paymentId }, session);
  }

  /**
   * Encapsulates state changes within the repository layer to isolate data mutations
   */
  async advanceSettlementState(settlementId, updateFields, session = null) {
    return this.model.findByIdAndUpdate(
      settlementId,
      { $set: updateFields },
      { new: true, runValidators: true, session }
    );
  }

  async advanceSettlementStateAtomic(settlementId, currentStatus, updateFields, session = null) {
    return this.model.findOneAndUpdate(
      {
        _id: settlementId,
        status: currentStatus
      },
      {
        $set: updateFields
      },
      {
        new: true,
        runValidators: true,
        session
      }
    );
  }
}

module.exports = new SettlementRepository();
