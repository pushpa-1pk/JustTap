const Joi = require("joi");
const env = require("../config/env");

const providerSearchSchema = {
  body: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(1).max(env.MAX_SEARCH_RADIUS_KM).optional(),
    serviceId: Joi.string().hex().length(24).optional(),
    limit: Joi.number().integer().min(1).max(100).default(env.DEFAULT_SEARCH_LIMIT),
  }),
};

module.exports = {
  providerSearchSchema,
};
