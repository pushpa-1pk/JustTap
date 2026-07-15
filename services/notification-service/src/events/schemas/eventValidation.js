const Joi = require('joi');

const baseEventSchema = Joi.object({
  eventId: Joi.string().guid({ version: 'uuidv4' }).required(),
  userId: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
  payload: Joi.object().required()
}).unknown(true);

module.exports = { baseEventSchema };