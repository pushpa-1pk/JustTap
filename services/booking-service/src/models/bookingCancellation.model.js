const mongoose = require('mongoose');

const BookingCancellationSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    cancelledBy: {
      userId: { type: mongoose.Schema.Types.Mixed, required: true },
      role: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN', 'SYSTEM'], required: true }
    },
    reasonCode: { type: String, required: true, trim: true },
    customExplanation: { type: String, trim: true, maxLength: 1000 },
    
    // Financial Implication Tracking Node
    penaltyApplied: { type: Number, default: 0, min: 0, required: true },
    refundStatus: { type: String, enum: ['NONE', 'PENDING', 'PROCESSED', 'FAILED'], default: 'NONE', required: true },
    platformLoss: { type: Number, default: 0, min: 0, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

module.exports = mongoose.model('BookingCancellation', BookingCancellationSchema);
