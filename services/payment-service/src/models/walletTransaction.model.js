const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    
    type: {
      type: String,
      enum: [
        "CREDIT_SETTLEMENT_ESCROW_INIT",
        "DEBIT_SETTLEMENT_FUNDS_RELEASED",
        "CREDIT_SETTLEMENT_FUNDS_RELEASED",
        "DEBIT_WITHDRAWAL_REQUESTED",
        "DEBIT_REFUND_REVERSAL",
        "CREDIT_DISPUTE_RESOLVED"
      ],
      required: true
    },
    
    amountPaise: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger } },
    balanceType: { type: String, enum: ["AVAILABLE", "PENDING"], required: true },
    
    // Auditing triple balances
    openingBalancePaise: { type: Number, required: true },
    closingBalancePaise: { type: Number, required: true },
    
    referenceModel: { type: String, enum: ["Settlement", "Withdrawal", "Refund"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: { type: String, required: true, trim: true },
    
    correlationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true } // Service name or Admin operator ID
  },
  { timestamps: true }
);

walletTransactionSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
