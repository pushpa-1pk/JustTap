const Joi = require("joi");

const updateProfileStatusSchema = Joi.object({
  profileCompleted: Joi.boolean().required(),
});

module.exports = {
  updateProfileStatusSchema,
};
