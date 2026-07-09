const Joi = require("joi");
const objectId = Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/);

const createService = Joi.object({
  categoryId: objectId.required(),
  name: Joi.string().trim().min(2).max(150).required(),
  slug: Joi.string().trim().lowercase().min(2).max(160).optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  estimatedDuration: Joi.number().integer().min(0).optional(),
  image: Joi.string().trim().allow("").optional(),
  isPopular: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

const updateService = Joi.object({
  categoryId: objectId.optional(),
  name: Joi.string().trim().min(2).max(150).optional(),
  slug: Joi.string().trim().lowercase().min(2).max(160).optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  estimatedDuration: Joi.number().integer().min(0).optional(),
  image: Joi.string().trim().allow("").optional(),
  isPopular: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createService,
  updateService,
};
