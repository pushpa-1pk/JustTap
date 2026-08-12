const mongoose = require("mongoose");

const customerWalletTransactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger },
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    balanceType: {
      type: String,
      enum: ["WALLET", "REWARDS", "CASHBACK", "REFERRAL"],
      default: "WALLET",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "CustomerWalletTransaction",
  customerWalletTransactionSchema
);
