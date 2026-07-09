const Joi = require('joi');
const { RESCHEDULE_REASON } = require('../constants/reschedule.constants');

const reschedulePayloadSchema = Joi.object({
  newStartTime: Joi.date().greater('now').required(),
  newEndTime: Joi.date().greater(Joi.ref('newStartTime')).required(),
  reasonCode: Joi.string().valid(...Object.values(RESCHEDULE_REASON)).required(),
  customExplanation: Joi.string().trim().max(1000).allow('', null)
});

module.exports = { reschedulePayloadSchema };