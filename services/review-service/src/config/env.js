const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
  RABBITMQ_URI: Joi.string().uri().default('amqp://127.0.0.1:5672').description('RabbitMQ AMQP connection URI'),
  RABBITMQ_EXCHANGE: Joi.string().default('justtap.events'),
  JWT_SECRET: Joi.string().min(16).default(Joi.ref('JWT_ACCESS_SECRET')).description('Cryptographic JWT sign token key'),
  JWT_ACCESS_SECRET: Joi.string().min(16).optional(),
  BOOKING_SERVICE_URL: Joi.string().uri().default('http://127.0.0.1:3001'),
  PROFILE_SERVICE_URL: Joi.string().uri().default('http://127.0.0.1:4001'),
  INTERNAL_API_KEY: Joi.string().min(8).default('justtap-internal-dev-key'),
  INTERNAL_REQUEST_TIMEOUT_MS: Joi.number().integer().min(500).default(3000),
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation failure setup failed: ${error.message}`);
}

module.exports = Object.freeze({
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URI,
    options: {}
  },
  rabbitmq: {
    uri: envVars.RABBITMQ_URI,
    exchanges: {
      events: envVars.RABBITMQ_EXCHANGE
    },
    queues: {
      bookingCompleted: 'review_service.booking_completed.queue'
    },
    routingKeys: {
      bookingCompleted: 'booking.completed',
      reviewCreated: 'review.created',
      reviewUpdated: 'review.updated',
      reviewDeleted: 'review.deleted',
      ratingUpdated: 'provider.rating.updated'
    }
  },
  jwt: {
    secret: envVars.JWT_SECRET
  },
  security: {
    internalApiKey: envVars.INTERNAL_API_KEY
  },
  services: {
    bookingServiceUrl: envVars.BOOKING_SERVICE_URL,
    profileServiceUrl: envVars.PROFILE_SERVICE_URL,
    internalRequestTimeoutMs: envVars.INTERNAL_REQUEST_TIMEOUT_MS
  }
});
