require("dotenv").config();

const ALLOWED_NODE_ENVS = new Set(["development", "test", "production"]);

const getString = (name, fallback = "") => {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value).trim();
};

const getRequiredString = (name, fallback = "") => {
  const value = getString(name, fallback);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getNumber = (name, fallback) => {
  const raw = getString(name, String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return value;
};

const getBoolean = (name, fallback = false) => {
  const raw = getString(name, fallback ? "true" : "false").toLowerCase();
  if (["true", "1", "yes", "y"].includes(raw)) return true;
  if (["false", "0", "no", "n"].includes(raw)) return false;
  throw new Error(`Invalid boolean environment variable: ${name}`);
};

const getList = (name, fallback = "") => {
  const value = getString(name, fallback);
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const NODE_ENV = getString("NODE_ENV", "development");

if (!ALLOWED_NODE_ENVS.has(NODE_ENV)) {
  throw new Error(
    `Invalid NODE_ENV "${NODE_ENV}". Expected one of: ${[...ALLOWED_NODE_ENVS].join(", ")}`
  );
}

const isProduction = NODE_ENV === "production";
const internalApiKeyFallback = isProduction ? "" : "justtap-internal-dev-key";

module.exports = {
  NODE_ENV,
  IS_PRODUCTION: isProduction,
  PORT: getNumber("PORT", 5003),
  SERVICE_NAME: getString("SERVICE_NAME", "matching-service"),
  MONGO_URI: getRequiredString(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/justtap_matching"
  ),
  REDIS_URL: getRequiredString("REDIS_URL", "redis://127.0.0.1:6379"),
  REDIS_DB: getNumber("REDIS_DB", 0),
  JWT_ACCESS_SECRET: getRequiredString("JWT_ACCESS_SECRET", "unsafe-dev-secret"),
  CORS_ORIGIN: getString("CORS_ORIGIN"),
  ALLOWED_ORIGINS: getList("ALLOWED_ORIGINS"),
  JSON_BODY_LIMIT: getString("JSON_BODY_LIMIT", "100kb"),
  LOG_LEVEL: getString("LOG_LEVEL", "info"),

  AUTH_SERVICE_URL: getString("AUTH_SERVICE_URL", "http://127.0.0.1:4000"),
  AUTH_USER_LOOKUP_REQUIRED: getBoolean("AUTH_USER_LOOKUP_REQUIRED", true),
  AUTH_USER_LOOKUP_TIMEOUT_MS: getNumber("AUTH_USER_LOOKUP_TIMEOUT_MS", 3000),

  PROFILE_SERVICE_URL: getString("PROFILE_SERVICE_URL", "http://127.0.0.1:4001"),
  SERVICE_MANAGEMENT_SERVICE_URL: getString(
    "SERVICE_MANAGEMENT_SERVICE_URL",
    "http://127.0.0.1:4002"
  ),
  BOOKING_SERVICE_URL: getString("BOOKING_SERVICE_URL", "http://127.0.0.1:5000"),
  CLIENT_TIMEOUT_MS: getNumber("CLIENT_TIMEOUT_MS", 3000),
  CLIENT_MAX_SOCKETS: getNumber("CLIENT_MAX_SOCKETS", 100),
  MAX_HTTP_KEEP_ALIVE_MSEC: getNumber("MAX_HTTP_KEEP_ALIVE_MSEC", 60000),

  INTERNAL_API_KEY: getRequiredString("INTERNAL_API_KEY", internalApiKeyFallback),

  MAX_SEARCH_RADIUS_KM: getNumber("MAX_SEARCH_RADIUS_KM", 25),
  DEFAULT_SEARCH_RADIUS_KM: getNumber("DEFAULT_SEARCH_RADIUS_KM", 10),
  DEFAULT_SEARCH_LIMIT: getNumber("DEFAULT_SEARCH_LIMIT", 20),
  PROVIDER_TIMEOUT_SECONDS: getNumber("PROVIDER_TIMEOUT_SECONDS", 60),
  STALE_LOCATION_THRESHOLD_MINUTES: getNumber(
    "STALE_LOCATION_THRESHOLD_MINUTES",
    5
  ),
  PRESENCE_TTL_SECONDS: getNumber("PRESENCE_TTL_SECONDS", 180),
  BOOKING_REQUEST_TTL_SECONDS: getNumber("BOOKING_REQUEST_TTL_SECONDS", 60),
  TIMEOUT_WORKER_POLL_INTERVAL_MS: getNumber(
    "TIMEOUT_WORKER_POLL_INTERVAL_MS",
    2000
  ),
  TIMEOUT_WORKER_BATCH_SIZE: getNumber("TIMEOUT_WORKER_BATCH_SIZE", 50),
  SEARCH_RATE_LIMIT_WINDOW_MS: getNumber("SEARCH_RATE_LIMIT_WINDOW_MS", 60000),
  SEARCH_RATE_LIMIT_MAX: getNumber("SEARCH_RATE_LIMIT_MAX", 30),
  LOCATION_RATE_LIMIT_WINDOW_MS: getNumber("LOCATION_RATE_LIMIT_WINDOW_MS", 60000),
  LOCATION_RATE_LIMIT_MAX: getNumber("LOCATION_RATE_LIMIT_MAX", 30),

  CIRCUIT_FAILURE_THRESHOLD: getNumber("CIRCUIT_FAILURE_THRESHOLD", 5),
  CIRCUIT_RESET_TIMEOUT_MSEC: getNumber("CIRCUIT_RESET_TIMEOUT_MSEC", 30000),

  MONGO_SERVER_SELECTION_TIMEOUT_MS: getNumber(
    "MONGO_SERVER_SELECTION_TIMEOUT_MS",
    5000
  ),
  MONGO_SOCKET_TIMEOUT_MS: getNumber("MONGO_SOCKET_TIMEOUT_MS", 45000),
};
