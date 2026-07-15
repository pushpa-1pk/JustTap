const dotenv = require("dotenv");

dotenv.config();

const readNumber = (key, fallback) => {
  const rawValue = process.env[key];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return parsed;
};

const readBoolean = (key, fallback = false) => {
  const rawValue = process.env[key];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  const normalized = String(rawValue).trim().toLowerCase();

  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean environment variable: ${key}`);
};

const requiredEnv = [
    "PORT",
    "MONGO_URI",
    "REDIS_URL",
    "JWT_ACCESS_SECRET"
];

requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT),
    serviceName: process.env.SERVICE_NAME || "booking-service",

    mongoUri: process.env.MONGO_URI,
    mongoServerSelectionTimeoutMs: readNumber("MONGO_SERVER_SELECTION_TIMEOUT_MS", 5000),
    mongoSocketTimeoutMs: readNumber("MONGO_SOCKET_TIMEOUT_MS", 45000),

    redisUrl: process.env.REDIS_URL,
    redisConnectTimeoutMs: readNumber("REDIS_CONNECT_TIMEOUT_MS", 5000),

    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:4000',
    authUserLookupRequired: readBoolean('AUTH_USER_LOOKUP_REQUIRED', true),
    authUserLookupTimeoutMs: readNumber('AUTH_USER_LOOKUP_TIMEOUT_MS', 3000),
    internalApiKey: process.env.INTERNAL_API_KEY || (process.env.NODE_ENV === 'production' ? '' : 'justtap-internal-dev-key'),

    profileServiceUrl: process.env.PROFILE_SERVICE_URL || 'http://127.0.0.1:4001',
    profileLookupRequired: readBoolean('PROFILE_LOOKUP_REQUIRED', true),
    profileLookupTimeoutMs: readNumber('PROFILE_LOOKUP_TIMEOUT_MS', 3000),

    serviceManagementServiceUrl: process.env.SERVICE_MANAGEMENT_SERVICE_URL || 'http://127.0.0.1:4002',
    serviceLookupRequired: readBoolean('SERVICE_LOOKUP_REQUIRED', true),
    serviceLookupTimeoutMs: readNumber('SERVICE_LOOKUP_TIMEOUT_MS', 3000),
    rabbitmqUri: process.env.RABBITMQ_URI || 'amqp://127.0.0.1:5672',
    rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'justtap.events',

    corsOrigin: process.env.CORS_ORIGIN,

    logLevel: process.env.LOG_LEVEL || "info",

    travelRatePerKm: readNumber("TRAVEL_RATE_PER_KM", 15),
    freeDistanceKm: readNumber("FREE_DISTANCE_KM", 2),
    platformCommissionPercent: readNumber("PLATFORM_COMMISSION_PERCENT", 15),
    gstPercent: readNumber("GST_PERCENT", 18),

    providerAcceptTimeoutMs: readNumber("PROVIDER_ACCEPT_TIMEOUT_MS", 60 * 1000),
    otpExpiryMs: readNumber("OTP_EXPIRY_MS", 5 * 60 * 1000),
    disputeWindowMaxHours: readNumber("DISPUTE_WINDOW_MAX_HOURS", 24),

    customerCancellationAfterAccept: readNumber("CUSTOMER_CANCELLATION_AFTER_ACCEPT", 50),
    providerCancellationOnTheWay: readNumber("PROVIDER_CANCELLATION_ON_THE_WAY", 100)
};
