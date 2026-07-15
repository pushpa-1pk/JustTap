const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    paymentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    gatewayPaymentId: { type: String, required: true, unique: true, trim: true },
    gatewaySignatureHash: { type: String, default: null, trim: true },
    
    amountPaidPaise: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger } },
    paymentMethod: { type: String, required: true, trim: true }, // upi, card, netbanking
    
    status: {
      type: String,
      enum: ["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "EXPIRED", "PARTIALLY_REFUNDED", "REFUNDED", "DISPUTED", "VOIDED"],
      default: "CREATED"
    },
    
    // Financial Snapshot freezing calculation rules at time of payment capture
    financialSnapshot: {
      platformFeePaise: { type: Number, required: true },
      platformGSTPaise: { type: Number, required: true },
      providerGSTPaise: { type: Number, default: 0 },
      tdsPaise: { type: Number, default: 0 },
      tcsPaise: { type: Number, default: 0 },
      otherDeductionsPaise: { type: Number, default: 0 },
      currency: { type: String, default: "INR" }
    },
    
    capturedAt: { type: Date },
    correlationId: { type: String, required: true, index: true },
    requestId: { type: String, required: true }
  },
  { timestamps: true }
);

paymentSchema.index({ providerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
