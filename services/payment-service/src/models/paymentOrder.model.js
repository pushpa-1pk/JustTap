const mongoose = require("mongoose");

const paymentOrderSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    gatewayOrderId: { type: String, required: true, unique: true, trim: true },
    
    // Stored strictly in Paise (Integer) to eliminate floating point issues
    amount: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger } },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "EXPIRED"],
      default: "PENDING"
    },
    attempts: { type: Number, default: 0, min: 0 },
    
    // Immutable snapshot freezing core booking metadata permanently
    bookingSnapshot: {
      customerName: { type: String, required: true, trim: true },
      providerName: { type: String, required: true, trim: true },
      serviceName: { type: String, required: true, trim: true },
      basePricePaise: { type: Number, required: true },
      scheduledTime: { type: Date, required: true }
    },
    
    correlationId: { type: String, required: true, index: true },
    requestId: { type: String, required: true }
  },
  { timestamps: true }
);

// High-speed matching vector index for operational dashboard queries
paymentOrderSchema.index({ customerId: 1, status: 1, createdAt: -1 });
paymentOrderSchema.index({ bookingId: 1, status: 1 });
paymentOrderSchema.index(
  { bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING", "COMPLETED"] }
    }
  }
);

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);
