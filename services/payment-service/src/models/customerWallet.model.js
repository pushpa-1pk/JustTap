const mongoose = require("mongoose");

const customerWalletSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    balancePaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger },
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger },
    },
    cashbackPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger },
    },
    referralBonusPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("CustomerWallet", customerWalletSchema);
