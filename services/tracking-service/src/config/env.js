const dotenv = require('dotenv');
const joi = require('joi');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().default(5004),
  SERVICE_NAME: joi.string().default('tracking-service'),
  MONGO_URI: joi.string().required().description('MongoDB connection URI'),
  REDIS_URL: joi.string().required().description('Redis broker connection URL'),
  JWT_ACCESS_SECRET: joi.string().required().description('JWT verification token secret'),
  JWT_ISSUER: joi.string().default('justtap-auth'),
  JWT_AUDIENCE: joi.string().default('justtap-clients'),
  BOOKING_SERVICE_URL: joi.string().required().uri().description('Internal endpoint for booking validation'),
  INTERNAL_API_KEY: joi.string().min(8).required(),
  RABBITMQ_URI: joi.string().uri().default('amqp://127.0.0.1:5672'),
  RABBITMQ_EXCHANGE: joi.string().default('justtap.events'),
  APP_URL: joi.string().uri().optional(),
  ADMIN_URL: joi.string().uri().optional(),
  ALLOWED_ORIGINS: joi.string().optional(),
  CORS_ORIGIN: joi.string().optional(),
  MAX_ACCURACY_THRESHOLD_METERS: joi.number().default(50),
  TELEMETRY_THROTTLE_WINDOW_MS: joi.number().default(2000),
  GEOFENCE_NEARBY: joi.number().default(500),
  GEOFENCE_ARRIVED: joi.number().default(100),
  TRACKING_STREAM_NAME: joi.string().default('mystream:tracking:events'),
  BOOKING_CONSUMER_GROUP: joi.string().default('group:tracking:booking-sync')
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Tracking Service Boot Validation Error: ${error.message}`);
}

const allowedOrigins = [
  ...(envVars.ALLOWED_ORIGINS ? envVars.ALLOWED_ORIGINS.split(',') : []),
  envVars.CORS_ORIGIN,
  envVars.APP_URL,
  envVars.ADMIN_URL
]
  .map((value) => String(value || '').trim())
  .filter(Boolean);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  serviceName: envVars.SERVICE_NAME,
  mongoUri: envVars.MONGO_URI,
  redisUrl: envVars.REDIS_URL,
  jwtAccessSecret: envVars.JWT_ACCESS_SECRET,
  jwtIssuer: envVars.JWT_ISSUER,
  jwtAudience: envVars.JWT_AUDIENCE,
  bookingServiceUrl: envVars.BOOKING_SERVICE_URL,
  internalApiKey: envVars.INTERNAL_API_KEY,
  rabbitmqUri: envVars.RABBITMQ_URI,
  rabbitmqExchange: envVars.RABBITMQ_EXCHANGE,
  allowedOrigins,
  maxAccuracyMeters: envVars.MAX_ACCURACY_THRESHOLD_METERS,
  throttleWindowMs: envVars.TELEMETRY_THROTTLE_WINDOW_MS,
  geofenceNearbyMeters: envVars.GEOFENCE_NEARBY,
  geofenceArrivedMeters: envVars.GEOFENCE_ARRIVED,
  trackingStreamName: envVars.TRACKING_STREAM_NAME,
  bookingConsumerGroup: envVars.BOOKING_CONSUMER_GROUP
};

module.exports = Object.freeze(config);
