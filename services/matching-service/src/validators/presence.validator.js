const Joi = require("joi");
const PROVIDER_STATUS = require("../constants/providerStatus");

const updateStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(PROVIDER_STATUS))
      .required(),
    activeBookingId: Joi.string().trim().allow(null, "").optional(),
  }),
};

module.exports = {
  updateStatusSchema,
};
