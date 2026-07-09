const Joi = require("joi");

module.exports = {
  addProviderService: Joi.object({
    serviceId: Joi.string().trim().required(),
    experience: Joi.number().integer().min(0).default(0),
    basePrice: Joi.number().min(0).required(),
    priceType: Joi.string().valid("hourly", "fixed", "per_unit").default("fixed"),
    isActive: Joi.boolean().default(true),
  }),
  updateProviderService: Joi.object({
    experience: Joi.number().integer().min(0),
    basePrice: Joi.number().min(0),
    priceType: Joi.string().valid("hourly", "fixed", "per_unit"),
    isActive: Joi.boolean(),
  }).min(1),
};
