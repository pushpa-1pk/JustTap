const Joi = require("joi");

const searchProviders = Joi.object({
  keyword: Joi.string().trim().max(150).optional(),
  categoryId: Joi.string().trim().optional(),
  serviceId: Joi.string().trim().optional(),
  providerId: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minExperience: Joi.number().min(0).max(50).optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  sortBy: Joi.string()
    .valid("price", "rating", "experience", "distance")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const listServices = Joi.object({
  categoryId: Joi.string().trim().optional(),
  keyword: Joi.string().trim().max(150).optional(),
  isPopular: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  searchProviders,
  listServices,
};
