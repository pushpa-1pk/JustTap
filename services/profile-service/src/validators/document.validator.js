const Joi = require("joi");

module.exports = {
  uploadDocument: Joi.object({
    documentType: Joi.string()
      .valid("aadhar", "pan", "profile_photo", "trade_license", "gst", "shop_license")
      .required(),
    fileUrl: Joi.string().trim().uri().optional(),
  }),
};
