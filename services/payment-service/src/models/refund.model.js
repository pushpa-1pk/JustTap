const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    gatewayRefundId: { type: String, unique: true, sparse: true, trim: true },
    
    amountPaise: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
      default: "PENDING"
    },
    
    idempotencyKey: { type: String, required: true, unique: true }, // Hashed signature string
    correlationId: { type: String, required: true, index: true },
    
    approvedBy: { type: String },
    approvedAt: { type: Date },
    processedAt: { type: Date },
    deletedAt: { type: Date } // Soft delete indicator for visibility management
  },
  { timestamps: true }
);

refundSchema.index({ paymentId: 1, status: 1 });

module.exports = mongoose.model("Refund", refundSchema);
