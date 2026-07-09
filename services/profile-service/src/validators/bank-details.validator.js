const Joi = require("joi");

const baseSchema = {
  accountHolderName: Joi.string().trim().max(100),
  accountNumber: Joi.string().trim().min(6).max(34),
  ifscCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  bankName: Joi.string().trim().max(100),
  accountType: Joi.string().valid("SAVINGS", "CURRENT"),
};

module.exports = {
  addBankDetails: Joi.object({
    accountHolderName: baseSchema.accountHolderName.required(),
    accountNumber: baseSchema.accountNumber.required(),
    ifscCode: baseSchema.ifscCode.required(),
    bankName: baseSchema.bankName.required(),
    accountType: baseSchema.accountType.default("SAVINGS"),
  }),
  updateBankDetails: Joi.object(baseSchema).min(1),
};
