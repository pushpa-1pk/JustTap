const Joi = require("joi");

const workingHoursSchema = Joi.object({
  start: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  end: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
});

module.exports = {
  createProviderProfile: Joi.object({
    businessName: Joi.string().trim().max(100).required(),
    experience: Joi.number().integer().min(0).default(0),
    workingRadius: Joi.number().min(1).max(100).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    workingHours: workingHoursSchema.required(),
    bio: Joi.string().trim().max(500).allow(""),
    profileImage: Joi.string().trim().uri().allow(null, ""),
    profileImageStorageKey: Joi.string().trim().allow(null, ""),
    profileImageStorageProvider: Joi.string().trim().allow(null, ""),
  }),
  updateProviderProfile: Joi.object({
    businessName: Joi.string().trim().max(100),
    experience: Joi.number().integer().min(0),
    workingRadius: Joi.number().min(1).max(100),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    workingHours: workingHoursSchema,
    bio: Joi.string().trim().max(500).allow(""),
    profileImage: Joi.string().trim().uri().allow(null, ""),
    profileImageStorageKey: Joi.string().trim().allow(null, ""),
    profileImageStorageProvider: Joi.string().trim().allow(null, ""),
  })
    .and("latitude", "longitude")
    .min(1),
  updateProviderLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
  updateProviderOnlineStatus: Joi.object({
    isOnline: Joi.boolean().required(),
  }),
};
