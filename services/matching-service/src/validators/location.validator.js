const Joi = require("joi");

const updateLocationSchema = {
  body: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360).optional(),
    speed: Joi.number().min(0).optional(),
    accuracy: Joi.number().min(0).optional(),
  }),
};

module.exports = {
  updateLocationSchema,
};
