const Joi = require('joi');
const dotenv = require('dotenv');
dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(4005),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  MONGO_URI: Joi.string().required(),
  REDIS_URI: Joi.string().required(),
  RABBITMQ_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  SMTP_HOST: Joi.string().allow(''),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow(''),
  SMTP_PASS: Joi.string().allow(''),
  SMTP_FROM_EMAIL: Joi.string().email().default('noreply@justtap.in'),
  TWILIO_ACCOUNT_SID: Joi.string().allow(''),
  TWILIO_AUTH_TOKEN: Joi.string().allow(''),
  TWILIO_PHONE_NUMBER: Joi.string().allow(''),
  PRIMARY_SMS_PROVIDER: Joi.string().valid('twilio', 'msg91').default('msg91'),
  MSG91_AUTH_KEY: Joi.string().allow(''),
  MSG91_SENDER_ID: Joi.string().allow(''),
  MSG91_ROUTE: Joi.string().default('4'),
  MSG91_COUNTRY: Joi.string().default('91'),
  MSG91_DLT_TEMPLATE_ID: Joi.string().allow(''),
  FIREBASE_CREDENTIALS_JSON: Joi.string().allow('')
}).unknown().required();

const { error, value } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config environment parsing failure: ${error.message}`);
}

module.exports = Object.freeze(value);
