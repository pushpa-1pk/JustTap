const Joi = require("joi");

const baseSchema = {
  fullName: Joi.string().trim().max(100),
  gender: Joi.string().valid("Male", "Female", "Other"),
  dateOfBirth: Joi.date().iso(),
  email: Joi.string().trim().email(),
  language: Joi.string().trim().max(30),
  profileImage: Joi.string().trim().uri(),
};

module.exports = {
  createCustomerProfile: Joi.object({
    fullName: baseSchema.fullName.required(),
    gender: baseSchema.gender.allow(null),
    dateOfBirth: baseSchema.dateOfBirth.allow(null),
    email: baseSchema.email.allow(null, ""),
    language: baseSchema.language,
    profileImage: baseSchema.profileImage.allow(""),
  }),
  updateCustomerProfile: Joi.object(baseSchema).min(1),
};
