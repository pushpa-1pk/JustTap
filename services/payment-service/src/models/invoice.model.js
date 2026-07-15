const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    
    type: { 
      type: String, 
      enum: ["CUSTOMER_RECEIPT", "PROVIDER_SETTLEMENT", "PLATFORM_COMMISSION"], 
      required: true 
    },
    
    invoiceStatus: {
      type: String,
      enum: ["GENERATING", "READY", "FAILED"],
      default: "GENERATING",
      index: true
    },
    
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    taxAmountPaise: { type: Number, required: true, min: 0 },
    s3Url: { type: String, default: null, trim: true },
    
    issuedAt: { type: Date, default: Date.now },
    correlationId: { type: String, required: true, index: true },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

invoiceSchema.index({ bookingId: 1, type: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
