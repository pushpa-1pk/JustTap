const Joi = require("joi");
const objectId = Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/);

const createProviderService = Joi.object({
  serviceId: objectId.required(),
  price: Joi.number().positive().required(),
  experience: Joi.number().min(0).max(50).optional(),
  isAvailable: Joi.boolean().optional(),
});

const updateProviderService = Joi.object({
  price: Joi.number().positive().optional(),
  experience: Joi.number().min(0).max(50).optional(),
  isAvailable: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const updateProviderServiceStatus = Joi.object({
  isAvailable: Joi.boolean().required(),
});

module.exports = {
  createProviderService,
  updateProviderService,
  updateProviderServiceStatus,
};
