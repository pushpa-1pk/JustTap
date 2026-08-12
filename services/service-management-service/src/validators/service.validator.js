const Joi = require("joi");
const objectId = Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/);

const pricingSchema = Joi.object({
  type: Joi.string().valid("FIXED", "BASE_PLUS_VARIABLE").optional(),
  basePrice: Joi.number().min(0).optional(),
  unit: Joi.string().valid("HOUR", "SERVICE", "FLAT").optional(),
  additionalUnitPrice: Joi.number().min(0).optional(),
});

const createService = Joi.object({
  categoryId: objectId.required(),
  name: Joi.string().trim().min(2).max(150).required(),
  slug: Joi.string().trim().lowercase().min(2).max(160).optional(),
  icon: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  pricing: pricingSchema.optional(),
  estimatedDuration: Joi.number().integer().min(0).optional(),
  image: Joi.string().trim().allow("").optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isPopular: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  createdBy: Joi.string().trim().optional(),
});

const updateService = Joi.object({
  categoryId: objectId.optional(),
  name: Joi.string().trim().min(2).max(150).optional(),
  slug: Joi.string().trim().lowercase().min(2).max(160).optional(),
  icon: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  pricing: pricingSchema.optional(),
  estimatedDuration: Joi.number().integer().min(0).optional(),
  image: Joi.string().trim().allow("").optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isPopular: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  updatedBy: Joi.string().trim().optional(),
}).min(1);

module.exports = {
  createService,
  updateService,
};
