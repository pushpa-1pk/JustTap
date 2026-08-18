const Joi = require("joi");
const { PLATFORMS, USER_ROLES } = require("../utils/constants");
const { normalizePhoneNumber } = require("../utils/phone.util");
const { getAllowedSignupRoles } = require("../utils/auth-role.util");

const phoneSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    try {
      return normalizePhoneNumber(value);
    } catch (error) {
      return helpers.error("any.invalid");
    }
  })
  .required()
  .messages({
    "string.empty": "Phone number is required",
    "any.invalid": "Invalid Indian phone number",
  });

const sendOtpSchema = Joi.object({
  phone: phoneSchema,
});

const verifyOtpSchema = Joi.object({
  phone: phoneSchema,
  otp: Joi.string().trim().length(6).pattern(/^\d+$/).required(),
  role: Joi.string()
    .valid(...getAllowedSignupRoles(), USER_ROLES.ADMIN)
    .optional(),
  deviceId: Joi.string().trim().required(),
  deviceName: Joi.string().trim().required(),
  platform: Joi.string()
    .valid(...Object.values(PLATFORMS))
    .required(),
  appVersion: Joi.string().trim().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
  deviceId: Joi.string().trim().required(),
  deviceName: Joi.string().trim().optional(),
  platform: Joi.string()
    .valid(...Object.values(PLATFORMS))
    .optional(),
  appVersion: Joi.string().trim().optional(),
});

const logoutSchema = Joi.object({
  deviceId: Joi.string().trim().required(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
};
