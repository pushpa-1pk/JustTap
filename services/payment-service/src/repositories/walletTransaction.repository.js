const BaseRepository = require("./base.repository");
const WalletTransaction = require("../models/walletTransaction.model");

class WalletTransactionRepository extends BaseRepository {
  constructor() {
    super(WalletTransaction);
  }

  async getHistoricalAuditStream(providerId, options = {}) {
    return this.find({ providerId }, options);
  }

  async getLedgerCursorStream(providerId, { limit = 10, nextCursor = null }) {
    const queryFilter = { providerId };

    // If an active cursor tracking token is provided, apply a compound evaluation limit filter
    if (nextCursor) {
      const [cursorTimestamp, cursorId] = Buffer.from(nextCursor, "base64").toString("utf8").split("|");
      
      queryFilter.$or = [
        { createdAt: { $lt: new Date(cursorTimestamp) } },
        { 
          createdAt: new Date(cursorTimestamp), 
          _id: { $lt: cursorId } 
        }
      ];
    }

    const records = await this.model.find(queryFilter)
      .sort({ createdAt: -1, _id: -1 }) // Enforce a strict deterministic sorting sequence
      .limit(limit + 1) // Fetch one extra record to evaluate if a next page exists
      .exec();

    const hasNextPage = records.length > limit;
    const items = hasNextPage ? records.slice(0, limit) : records;

    let generatedCursorToken = null;
    if (items.length > 0 && hasNextPage) {
      const lastItem = items[items.length - 1];
      const cursorRawString = `${lastItem.createdAt.toISOString()}|${lastItem._id}`;
      generatedCursorToken = Buffer.from(cursorRawString).toString("base64");
    }

    return {
      items,
      meta: {
        nextCursor: generatedCursorToken,
        count: items.length
      }
    };
  }
}

module.exports = new WalletTransactionRepository();