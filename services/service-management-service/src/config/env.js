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
  const raw = getString(name, fallback);
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }

  return value;
};

const getBoolean = (name, fallback = false) => {
  const raw = getString(name, fallback ? "true" : "false").toLowerCase();

  if (["true", "1", "yes", "y"].includes(raw)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(raw)) {
    return false;
  }

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

module.exports = {
  NODE_ENV,
  IS_PRODUCTION: NODE_ENV === "production",
  PORT: getNumber("PORT", 4002),
  MONGO_URI: getRequiredString(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/justtap_service_catalog"
  ),
  JWT_ACCESS_SECRET: getRequiredString("JWT_ACCESS_SECRET", "unsafe-dev-secret"),
  JSON_BODY_LIMIT: getString("JSON_BODY_LIMIT", "100kb"),
  ALLOWED_ORIGINS: getList("ALLOWED_ORIGINS"),
  LOG_LEVEL: getString("LOG_LEVEL", "info"),
  AUTH_SERVICE_URL: getString("AUTH_SERVICE_URL", "http://127.0.0.1:4000"),
  AUTH_USER_LOOKUP_REQUIRED: getBoolean("AUTH_USER_LOOKUP_REQUIRED", true),
  AUTH_USER_LOOKUP_TIMEOUT_MS: getNumber("AUTH_USER_LOOKUP_TIMEOUT_MS", 3000),
  PROFILE_SERVICE_URL: getString("PROFILE_SERVICE_URL", "http://127.0.0.1:4001"),
  PROFILE_LOOKUP_TIMEOUT_MS: getNumber("PROFILE_LOOKUP_TIMEOUT_MS", 3000),
  DEFAULT_ETA_MINUTES_PER_KM: getNumber("DEFAULT_ETA_MINUTES_PER_KM", 3),
};
