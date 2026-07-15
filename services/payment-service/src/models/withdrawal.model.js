const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amountPaise: { type: Number, required: true, min: 10000 }, // Enforces a structural ₹100 floor
    
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "REQUESTED"
    },
    
    // Encrypted string blocks (AES-256 ciphertexts)
    encryptedBankDetails: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      accountHolderName: { type: String, required: true }
    },
    
    gatewayPayoutId: { type: String, unique: true, sparse: true, trim: true },
    rejectionReason: { type: String, trim: true },
    completedAt: { type: Date },
    
    correlationId: { type: String, required: true, index: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

withdrawalSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);