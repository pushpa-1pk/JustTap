const mongoose = require('mongoose');

const BookingRescheduleSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    requestedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      role: { type: String, enum: ['CUSTOMER', 'PROVIDER'], required: true }
    },
    previousStartTime: { type: Date, required: true },
    previousEndTime: { type: Date, required: true },
    proposedStartTime: { type: Date, required: true },
    proposedEndTime: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxLength: 500 },
    approvalStatus: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'], default: 'PENDING', required: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('BookingReschedule', BookingRescheduleSchema);