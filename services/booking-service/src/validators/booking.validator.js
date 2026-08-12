const Joi = require('joi');
const { BOOKING_TYPES } = require('../constants/booking.constants');
const { BOOKING_STATUS } = require('../constants/booking-status');
const { OTP_PURPOSE } = require('../constants/otp.constants');

const objectIdPattern = Joi.string().hex().length(24);

// Reusable parameter schema for matching URL route extensions safely
const bookingIdSchema = Joi.object({
  id: objectIdPattern.required()
});

const createBookingSchema = Joi.object({
  serviceId: objectIdPattern.required(),
  providerServiceId: objectIdPattern.required(),
  bookingType: Joi.string().valid(...Object.values(BOOKING_TYPES)).required(),
  
  scheduledStartTime: Joi.date().greater('now').required(),
  scheduledEndTime: Joi.date().greater(Joi.ref('scheduledStartTime')).required(),
  
  couponCode: Joi.string().trim().uppercase().allow(null, ''),
  couponDiscountAmount: Joi.number().min(0).default(0),

  customerAddressSnapshot: Joi.object({
    label: Joi.string().trim().required(),
    addressLine1: Joi.string().trim().required(),
    addressLine2: Joi.string().trim().allow(null, ''),
    landmark: Joi.string().trim().allow(null, ''),
    
    // Bug Fix 1: Removed nested type property object styling anomalies
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    
    pincode: Joi.string().trim().required(),
    location: Joi.object({
      type: Joi.string().valid('Point').required(),
      
      // Bug Fix 2: Enforced exact coordinate array order index limits
      coordinates: Joi.array()
        .ordered(
          Joi.number().min(-180).max(180), // Index 0: Longitude
          Joi.number().min(-90).max(90)    // Index 1: Latitude
        )
        .length(2)
        .required()
    }).required()
  }).required(),

  additionalNotes: Joi.string().max(500).trim().allow(null, '')
});

const advanceStatusSchema = Joi.object({
  nextStatus: Joi.string().valid(...Object.values(BOOKING_STATUS)).required()
});

const verifyHandshakeSchema = Joi.object({
  rawOtp: Joi.string().pattern(/^\d{6}$/).required(),
  purpose: Joi.string().valid(...Object.values(OTP_PURPOSE)).required(),
  completionPhotos: Joi.array().items(Joi.string().uri()).optional()
});

module.exports = {
  bookingIdSchema,
  createBookingSchema,
  advanceStatusSchema,
  verifyHandshakeSchema
};
