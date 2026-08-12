const Joi = require("joi");

const emergencyContactSchema = Joi.object({
  name: Joi.string().trim().allow("").max(100),
  phone: Joi.string().trim().allow("").max(20),
  relationship: Joi.string().trim().allow("").max(50),
});

const baseSchema = {
  fullName: Joi.string().trim().max(100),
  gender: Joi.string().valid("Male", "Female", "Other", null).allow(null, ""),
  dateOfBirth: Joi.date().iso().allow(null, ""),
  email: Joi.string().trim().email().allow(null, ""),
  language: Joi.string().trim().max(30),
  profileImage: Joi.string().trim().uri().allow(null, ""),
  profileImageStorageKey: Joi.string().trim().allow(null, ""),
  profileImageStorageProvider: Joi.string().trim().allow(null, ""),
  emergencyContact: emergencyContactSchema.allow(null),
};

module.exports = {
  createCustomerProfile: Joi.object({
    fullName: baseSchema.fullName.required(),
    gender: baseSchema.gender,
    dateOfBirth: baseSchema.dateOfBirth,
    email: baseSchema.email,
    language: baseSchema.language,
    profileImage: baseSchema.profileImage,
    profileImageStorageKey: baseSchema.profileImageStorageKey,
    profileImageStorageProvider: baseSchema.profileImageStorageProvider,
    emergencyContact: baseSchema.emergencyContact,
  }),
  updateCustomerProfile: Joi.object(baseSchema).min(1),
};
