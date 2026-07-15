const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createRequestInvitationSchema = {
  body: Joi.object({
    bookingId: objectId.required(),
    providerId: objectId.required(),
    serviceId: objectId.required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    providerSnapshot: Joi.object({
      businessName: Joi.string().trim().max(100).allow(null, "").optional(),
      phone: Joi.string().trim().allow(null, "").optional(),
    }).optional(),
  }),
};

const resolveRequestSchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

module.exports = {
  createRequestInvitationSchema,
  resolveRequestSchema,
};
