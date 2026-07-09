const Joi = require('joi');
const { CANCELLATION_REASON } = require('../constants/cancellation.constants');

const cancellationPayloadSchema = Joi.object({
  // Re-engineered to enforce exact validation against our standard domain reasons
  reasonCode: Joi.string()
    .valid(...Object.values(CANCELLATION_REASON))
    .required()
    .messages({
      'any.only': 'Validation Error: Provided reasonCode is unmapped on this marketplace platform.'
    }),
  customExplanation: Joi.string().trim().max(1000).allow('', null)
});

module.exports = { cancellationPayloadSchema };