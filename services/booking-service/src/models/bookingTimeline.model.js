const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../constants/booking-status');

const BookingTimelineSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    status: { type: String, enum: Object.values(BOOKING_STATUS), required: true },
    action: { type: String, required: true, uppercase: true, trim: true }, // Fast exact index filtering
    message: { type: String, required: true, trim: true, maxLength: 1000 },
    triggeredBy: {
      userId: { type: mongoose.Schema.Types.Mixed, required: true },
      role: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN', 'SYSTEM'], required: true }
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

BookingTimelineSchema.index({ bookingId: 1, createdAt: -1 });
BookingTimelineSchema.index({ action: 1 });

module.exports = mongoose.model('BookingTimeline', BookingTimelineSchema);
