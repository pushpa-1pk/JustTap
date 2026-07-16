const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

// Extend Joi with strict HTML sanitization rules to eliminate structural XSS injections
const sanitizedString = Joi.string().custom((value, helpers) => {
  const clean = sanitizeHtml(value, {
    allowedTags: [], // Strip all HTML structural tags explicitly
    allowedAttributes: {}, // Block all attribute attachments
  });
  if (clean !== value) {
    return helpers.error('string.xssSanitized');
  }
  return clean;
});

const customJoi = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.xssSanitized': '{{#label}} contains unauthorized HTML syntax tags or script markers.',
  },
  rules: {
    sanitize: {
      validate(value, helpers) {
        return helpers.error('string.xssSanitized');
      }
    }
  }
}));

const reviewCreateSchema = Joi.object({
  bookingId: Joi.string().required().trim().description('Unique transaction trace token identifier reference'),
  providerId: Joi.string().required().trim(),
  serviceId: Joi.string().required().trim(),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be an absolute scalar integer value.',
    'number.min': 'Rating matrix lower boundary cannot fall below 1 star.',
    'number.max': 'Rating matrix upper boundary cannot scale above 5 stars.'
  }),
  title: sanitizedString.max(100).allow('').trim(),
  comment: sanitizedString.max(1000).allow('').trim(),
  images: Joi.array().items(Joi.string().uri()).max(5).default([]),
  tags: Joi.array().items(sanitizedString.max(30)).max(10).default([])
});

const reviewUpdateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  title: sanitizedString.max(100).allow('').trim(),
  comment: sanitizedString.max(1000).allow('').trim(),
  images: Joi.array().items(Joi.string().uri()).max(5),
  tags: Joi.array().items(sanitizedString.max(30)).max(10)
}).min(1); // Require at least one modification parameter to prevent empty updates

const reviewReportSchema = Joi.object({
  reason: sanitizedString.max(500).required().trim().messages({
    'any.required': 'A reason is required to flag review items.'
  })
});

module.exports = {
  validateCreateReview: (payload) => reviewCreateSchema.validate(payload, { abortEarly: false, stripUnknown: true }),
  validateUpdateReview: (payload) => reviewUpdateSchema.validate(payload, { abortEarly: false, stripUnknown: true }),
  validateReportReview: (payload) => reviewReportSchema.validate(payload, { abortEarly: false, stripUnknown: true })
};