const Joi = require("joi");

const baseAddress = {
  label: Joi.string().valid("home", "work", "other"),
  addressLine1: Joi.string().trim().max(200),
  addressLine2: Joi.string().trim().max(200).allow(""),
  city: Joi.string().trim(),
  state: Joi.string().trim(),
  pincode: Joi.string().trim().pattern(/^[1-9][0-9]{5}$/),
  country: Joi.string().trim().max(100),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  isPrimary: Joi.boolean(),
};

module.exports = {
  createAddress: Joi.object({
    label: baseAddress.label.default("home"),
    addressLine1: baseAddress.addressLine1.required(),
    addressLine2: baseAddress.addressLine2,
    city: baseAddress.city.required(),
    state: baseAddress.state.required(),
    pincode: baseAddress.pincode.required(),
    country: baseAddress.country.default("India"),
    latitude: baseAddress.latitude.required(),
    longitude: baseAddress.longitude.required(),
    isPrimary: baseAddress.isPrimary,
  }),
  updateAddress: Joi.object(baseAddress).min(1),
};
