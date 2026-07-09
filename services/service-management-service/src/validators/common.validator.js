const Joi = require("joi");

const objectId = Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/);

const parseBoolean = Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0");

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const adminCategoryListQuery = Joi.object({
  includeInactive: parseBoolean.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(100),
});

const serviceListQuery = Joi.object({
  categoryId: objectId.optional(),
  includeInactive: parseBoolean.optional(),
  keyword: Joi.string().trim().max(150).optional(),
  isPopular: parseBoolean.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const customSkillListQuery = Joi.object({
  status: Joi.string().trim().valid("Pending", "Approved", "Rejected").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const searchProvidersQuery = Joi.object({
  keyword: Joi.string().trim().max(150).optional(),
  categoryId: objectId.optional(),
  serviceId: objectId.optional(),
  providerId: Joi.string().trim().max(100).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minExperience: Joi.number().min(0).max(50).optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  sortBy: Joi.string().valid("price", "rating", "experience", "distance").default("price"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).custom((value, helpers) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    return helpers.message("minPrice cannot be greater than maxPrice");
  }

  if ((value.latitude === undefined) !== (value.longitude === undefined)) {
    return helpers.message("latitude and longitude must be provided together");
  }

  return value;
}, "search-provider constraints");

const categoryIdParam = Joi.object({
  categoryId: objectId.required(),
});

const serviceIdParam = Joi.object({
  serviceId: objectId.required(),
});

const providerServiceIdParam = Joi.object({
  providerServiceId: objectId.required(),
});

const customSkillIdParam = Joi.object({
  customSkillId: objectId.required(),
});

module.exports = {
  paginationQuery,
  adminCategoryListQuery,
  serviceListQuery,
  customSkillListQuery,
  searchProvidersQuery,
  categoryIdParam,
  serviceIdParam,
  providerServiceIdParam,
  customSkillIdParam,
};
