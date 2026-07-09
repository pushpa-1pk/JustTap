const Joi = require("joi");
const objectId = Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/);

const createCustomSkill = Joi.object({
  skillName: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  experience: Joi.number().min(0).max(50).optional(),
});

const updateCustomSkill = Joi.object({
  skillName: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  experience: Joi.number().min(0).max(50).optional(),
}).min(1);

const rejectCustomSkill = Joi.object({
  adminRemarks: Joi.string().trim().max(500).required(),
});

const approveCustomSkill = Joi.object({
  adminRemarks: Joi.string().trim().max(500).allow("").optional(),
});

const convertCustomSkill = Joi.object({
  categoryId: objectId.required(),
  estimatedDuration: Joi.number().integer().min(0).optional(),
  isPopular: Joi.boolean().optional(),
});

module.exports = {
  createCustomSkill,
  updateCustomSkill,
  rejectCustomSkill,
  approveCustomSkill,
  convertCustomSkill,
};
