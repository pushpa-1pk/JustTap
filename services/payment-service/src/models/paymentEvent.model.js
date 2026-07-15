const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    paymentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    gatewayEventId: { type: String, trim: true }, // Razorpay event ID if sourced from a webhook
    
    eventType: {
      type: String,
      enum: [
        "PAYMENT_CREATED", "PAYMENT_AUTHORIZED", "PAYMENT_CAPTURED", "PAYMENT_FAILED", 
        "PAYMENT_REFUNDED", "WEBHOOK_RECEIVED", "WEBHOOK_RETRY", "SETTLEMENT_CREATED", 
        "SETTLEMENT_COMPLETED", "WITHDRAWAL_REQUESTED", "WITHDRAWAL_APPROVED"
      ],
      required: true,
      index: true
    },
    
    payloadSnapshot: { type: mongoose.Schema.Types.Mixed, required: true }, // The complete message object payload
    correlationId: { type: String, required: true, index: true },
    requestId: { type: String, required: true }
  },
  { timestamps: true }
);

paymentEventSchema.index({ gatewayEventId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
