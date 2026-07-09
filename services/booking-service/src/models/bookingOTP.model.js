const mongoose = require('mongoose');

const BookingOTPSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    hashedOtp: { type: String, required: true },
    otpPurpose: { type: String, enum: ['START_SERVICE', 'COMPLETE_SERVICE'], required: true },
    
    // Financial Security Analytics Metrics
    attemptCount: { type: Number, default: 0, required: true },
    maxAttempts: { type: Number, default: 3, required: true },
    
    verifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('BookingOTP', BookingOTPSchema);