const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    
    grossAmountPaise: { type: Number, required: true, min: 1 },
    platformFeePaise: { type: Number, required: true },
    platformGSTPaise: { type: Number, required: true },
    providerGSTPaise: { type: Number, default: 0 },
    tdsPaise: { type: Number, default: 0 },
    tcsPaise: { type: Number, default: 0 },
    otherDeductionsPaise: { type: Number, default: 0 },
    netPayoutPaise: { type: Number, required: true },
    
    status: {
      type: String,
      enum: ["PENDING", "SETTLED", "FAILED", "HELD_DISPUTE"],
      default: "PENDING"
    },
    
    settledAt: { type: Date },
    correlationId: { type: String, required: true, index: true },
    
    // Auditing trackers
    approvedBy: { type: String },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

settlementSchema.index({ providerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Settlement", settlementSchema);