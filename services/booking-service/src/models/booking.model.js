const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../constants/booking-status');
const { PAYMENT_STATUS } = require('../constants/payment-status');
const { BOOKING_TYPES } = require('../constants/booking.constants');

const BookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    providerServiceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    bookingType: { type: String, enum: Object.values(BOOKING_TYPES), required: true },
    bookingStatus: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.REQUESTED, required: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, required: true },
    
    rescheduleCount: { type: Number, default: 0, required: true },

    scheduledStartTime: { type: Date, required: true },
    scheduledEndTime: { type: Date, required: true },
    
    requestedAt: { type: Date, default: Date.now, required: true },
    acceptedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    serviceStartedAt: { type: Date, default: null },
    serviceCompletedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // Immutable Identity Snapshots protecting historical billing ledger lookups
    customerSnapshot: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true }
    },
    providerSnapshot: {
      businessName: { type: String, default: null, trim: true },
      phone: { type: String, default: null, trim: true }
    },

    // Extensible pricing matrix snapshot
    snapshotPricing: {
      serviceBasePrice: { type: Number, required: true, min: 0 },
      travelCharge: { type: Number, required: true, min: 0, default: 0 },
      platformCommissionFee: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0, default: 0 },
      discountAmount: { type: Number, required: true, min: 0, default: 0 },
      couponDiscount: { type: Number, required: true, min: 0, default: 0 },
      totalAmountToPay: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, default: 'INR', uppercase: true }
    },

    customerAddressSnapshot: {
      label: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, trim: true, default: null },
      landmark: { type: String, trim: true, default: null },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point', required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
      }
    },

    additionalNotes: { type: String, maxLength: 500, trim: true },
    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true, versionKey: false }
);

// Enforce strict cron/booking date sequence boundary rules
BookingSchema.pre('validate', function(next) {
  if (this.scheduledEndTime <= this.scheduledStartTime) {
    this.invalidate('scheduledEndTime', 'The scheduled booking end time must chronologically succeed the start time.');
  }
  next();
});

BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ 'customerAddressSnapshot.location': '2dsphere' });
BookingSchema.index({ customerId: 1, bookingStatus: 1 });
BookingSchema.index({ providerId: 1, bookingStatus: 1 });
BookingSchema.index({ bookingStatus: 1, scheduledStartTime: 1 });

module.exports = mongoose.model('Booking', BookingSchema);