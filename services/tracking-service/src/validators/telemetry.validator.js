const joi = require('joi');

const telemetryUpdateSchema = joi.object({
  bookingId: joi.string().hex().length(24).required().messages({
    'string.length': 'Malformed target tracking validation argument: Invalid ObjectId mapping footprint.'
  }),
  latitude: joi.number().min(-90).max(90).required(),
  longitude: joi.number().min(-180).max(180).required(),
  accuracy: joi.number().min(0).required(),
  speed: joi.number().min(0).optional().default(0),
  heading: joi.number().min(0).max(360).optional().default(0),
  timestamp: joi.date().iso().required()
});

module.exports = { telemetryUpdateSchema };