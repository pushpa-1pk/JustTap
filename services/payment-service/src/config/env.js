const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Complete financial ecosystem environment schema schema
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid("production", "development", "test").default("development"),
  PORT: Joi.number().integer().min(1024).max(65535).default(5005),
  SERVICE_NAME: Joi.string().default("payment-service"),
  MONGO_URI: Joi.string().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  RAZORPAY_KEY_ID: Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().required(),
  BOOKING_SERVICE_URL: Joi.string().uri().default("http://127.0.0.1:4003"),
  RABBITMQ_URI: Joi.string().uri().default("amqp://127.0.0.1:5672"),
  RABBITMQ_EXCHANGE: Joi.string().default("justtap.events"),
  INTERNAL_API_KEY: Joi.string().min(8).required(),
  BANK_ENCRYPTION_SECRET: Joi.string().min(16).default(Joi.ref("JWT_ACCESS_SECRET")),
  PLATFORM_COMMISSION_PERCENT: Joi.number().min(0).max(100).default(10.0),
  GST_PERCENT_ON_COMMISSION: Joi.number().min(0).max(100).default(18.0),
  SETTLEMENT_HOLD_HOURS: Joi.number().integer().min(0).default(24),
  OUTBOX_BATCH_SIZE: Joi.number().integer().min(1).default(20),
  OUTBOX_LOOP_INTERVAL_MS: Joi.number().integer().min(50).default(500),
  OUTBOX_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),
  CORS_ORIGIN: Joi.string().default("http://localhost:3000")
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`[CRITICAL] Configuration Validation Failure: ${error.message}`);
}

const config = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  serviceName: envVars.SERVICE_NAME,
  database: {
    uri: envVars.MONGO_URI,
    autoIndex: envVars.NODE_ENV !== "production"
  },
  redis: {
    url: envVars.REDIS_URL
  },
  auth: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    issuer: envVars.JWT_ISSUER,
    audience: envVars.JWT_AUDIENCE
  },
  gateway: {
    razorpayKeyId: envVars.RAZORPAY_KEY_ID,
    razorpayKeySecret: envVars.RAZORPAY_KEY_SECRET,
    webhookSecret: envVars.RAZORPAY_WEBHOOK_SECRET
  },
  services: {
    bookingServiceUrl: envVars.BOOKING_SERVICE_URL
  },
  messaging: {
    rabbitmqUri: envVars.RABBITMQ_URI,
    exchange: envVars.RABBITMQ_EXCHANGE
  },
  financials: {
    platformCommissionPercent: envVars.PLATFORM_COMMISSION_PERCENT,
    gstPercentOnCommission: envVars.GST_PERCENT_ON_COMMISSION,
    settlementHoldHours: envVars.SETTLEMENT_HOLD_HOURS
  },
  security: {
    corsOrigin: envVars.CORS_ORIGIN.split(","),
    internalApiKey: envVars.INTERNAL_API_KEY,
    bankEncryptionSecret: envVars.BANK_ENCRYPTION_SECRET
  },
  outbox: {
    batchSize: envVars.OUTBOX_BATCH_SIZE,
    loopIntervalMs: envVars.OUTBOX_LOOP_INTERVAL_MS,
    maxAttempts: envVars.OUTBOX_MAX_ATTEMPTS
  }
};

// Deep freeze utility implementation to guarantee structural immutability
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

module.exports = deepFreeze(config);
