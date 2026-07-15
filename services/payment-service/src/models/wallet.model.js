const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    
    // Projections calculated using atomic integer increments from the ledger
    availableBalancePaise: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger } },
    pendingBalancePaise: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger } },
    withdrawnBalancePaise: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger } },
    lifetimeEarningsPaise: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger } },
    
    // Optimistic concurrency control layer protecting against double-spend races
    version: { type: Number, default: 0, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);