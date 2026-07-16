const Joi = require('joi');

const registerDeviceSchema = Joi.object({
  fcmToken: Joi.string().trim().min(10).required().messages({
    'string.empty': 'FCM Token cannot be blank.',
    'any.required': 'fcmToken is a mandatory parameter.'
  }),
  deviceId: Joi.string().trim().min(5).required().messages({
    'string.empty': 'Device Hardware ID cannot be blank.',
    'any.required': 'deviceId is a mandatory parameter.'
  }),
  platform: Joi.string().uppercase().valid('ANDROID', 'IOS', 'WEB').required().messages({
    'any.only': 'Platform must be one of: ANDROID, IOS, or WEB.'
  }),
  appVersion: Joi.string().trim().regex(/^v?\d+\.\d+\.\d+(-.+)?$/).required().messages({
    'string.pattern.base': 'Application version must follow semantic versioning standards (e.g., v1.0.0).'
  })
});

const updatePreferencesSchema = Joi.object({
  categories: Joi.object({
    booking: Joi.boolean(),
    payment: Joi.boolean(),
    wallet: Joi.boolean(),
    review: Joi.boolean(),
    marketing: Joi.boolean(),
    support: Joi.boolean(),
    promotions: Joi.boolean(),
    system: Joi.boolean()
  }).min(1),
  channels: Joi.object({
    push: Joi.boolean(),
    email: Joi.boolean(),
    sms: Joi.boolean(),
    inapp: Joi.boolean()
  }).min(1),
  language: Joi.string().lowercase().valid('en', 'hi', 'te', 'ta', 'kn').messages({
    'any.only': 'Supported localization constraints restricted to: en, hi, te, ta, kn.'
  })
}).min(1);

const broadcastNotificationSchema = Joi.object({
  targetRoles: Joi.array().items(Joi.string().valid('CUSTOMER', 'PROVIDER', 'ADMIN')).min(1).required(),
  title: Joi.string().trim().min(5).max(100).required(),
  body: Joi.string().trim().min(10).max(500).required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'CRITICAL').default('NORMAL'),
  metadata: Joi.object().unknown(true).optional()
});

const testNotificationSchema = Joi.object({
  userId: Joi.string().trim().required(),
  channel: Joi.string().uppercase().valid('PUSH', 'EMAIL', 'SMS', 'IN_APP').required(),
  title: Joi.string().trim().required(),
  body: Joi.string().trim().required(),
  metadata: Joi.object().unknown(true).optional()
});

module.exports = {
  registerDeviceSchema,
  updatePreferencesSchema,
  broadcastNotificationSchema,
  testNotificationSchema
};
