const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["UPI", "CARD"],
      required: true,
    },
    details: {
      upiId: { type: String, trim: true },
      cardLast4: { type: String, trim: true },
      cardBrand: { type: String, trim: true },
      cardExpiry: { type: String, trim: true },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
