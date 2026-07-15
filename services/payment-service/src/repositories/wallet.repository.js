const BaseRepository = require("./base.repository");
const Wallet = require("../models/wallet.model");
const ApiError = require("../utils/ApiError");

class WalletRepository extends BaseRepository {
  constructor() {
    super(Wallet);
  }

  async findByProviderId(providerId, session = null) {
    return this.findOne({ providerId }, session);
  }

  async upsertWallet(providerId, session = null) {
    return this.model.findOneAndUpdate(
      { providerId },
      { 
        $setOnInsert: { 
          availableBalancePaise: 0, 
          pendingBalancePaise: 0, 
          withdrawnBalancePaise: 0, 
          lifetimeEarningsPaise: 0, 
          version: 0 
        } 
      },
      { upsert: true, new: true, session }
    );
  }

  async updateBalancesWithVersionCheck(providerId, balanceIncrements, currentVersion, session = null) {
    const updateFilter = { providerId, version: currentVersion };

    if (balanceIncrements.availableBalancePaise < 0) {
      updateFilter.availableBalancePaise = { $gte: Math.abs(balanceIncrements.availableBalancePaise) };
    }
    if (balanceIncrements.pendingBalancePaise < 0) {
      updateFilter.pendingBalancePaise = { $gte: Math.abs(balanceIncrements.pendingBalancePaise) };
    }

    // P2 Upgrade: Enforce write concern majority to guarantee financial data permanency at the replica set tier
    const result = await this.model.findOneAndUpdate(
      updateFilter,
      { $inc: { ...balanceIncrements, version: 1 } },
      { 
        new: true, 
        runValidators: true, 
        session,
        writeConcern: { w: "majority", j: true } // Protects against dynamic rollbacks during primary node elections
      }
    );

    if (!result) {
      throw new ApiError(409, "Optimistic lock conflict or balance validation failure encountered.");
    }
    return result;
  }
}

module.exports = new WalletRepository();