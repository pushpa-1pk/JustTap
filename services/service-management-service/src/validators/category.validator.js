const Joi = require("joi");

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  slug: Joi.string().trim().lowercase().min(2).max(120).optional(),
  icon: Joi.string().trim().allow("").optional(),
  bannerImage: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().max(500).allow("").optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const updateCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  slug: Joi.string().trim().lowercase().min(2).max(120).optional(),
  icon: Joi.string().trim().allow("").optional(),
  bannerImage: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().max(500).allow("").optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createCategory,
  updateCategory,
};
