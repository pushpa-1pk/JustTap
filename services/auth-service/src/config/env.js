require("dotenv").config();

const ALLOWED_NODE_ENVS = new Set([
  "development",
  "test",
  "production",
]);

const getString = (name, fallback = "") => {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim();
};

const getRequiredString = (name) => {
  const value = getString(name);

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
    `Invalid NODE_ENV "${NODE_ENV}". Expected one of: ${[
      ...ALLOWED_NODE_ENVS,
    ].join(", ")}`
  );
}

const env = {
  NODE_ENV,
  IS_PRODUCTION: NODE_ENV === "production",
  PORT: getNumber("PORT", 4000),
  MONGO_URI: getRequiredString("MONGO_URI"),
  REDIS_URL: getRequiredString("REDIS_URL"),
  JWT_ACCESS_SECRET: getRequiredString("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getRequiredString("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRES: getString("ACCESS_TOKEN_EXPIRES", "15m"),
  REFRESH_TOKEN_EXPIRES: getString("REFRESH_TOKEN_EXPIRES", "30d"),
  JSON_BODY_LIMIT: getString("JSON_BODY_LIMIT", "100kb"),
  ALLOWED_ORIGINS: getList("ALLOWED_ORIGINS"),
  SEND_OTP_RATE_LIMIT_WINDOW_MS: getNumber(
    "SEND_OTP_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000
  ),
  SEND_OTP_RATE_LIMIT_MAX: getNumber("SEND_OTP_RATE_LIMIT_MAX", 5),
  VERIFY_OTP_RATE_LIMIT_WINDOW_MS: getNumber(
    "VERIFY_OTP_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000
  ),
  VERIFY_OTP_RATE_LIMIT_MAX: getNumber("VERIFY_OTP_RATE_LIMIT_MAX", 10),
  REFRESH_TOKEN_RATE_LIMIT_WINDOW_MS: getNumber(
    "REFRESH_TOKEN_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000
  ),
  REFRESH_TOKEN_RATE_LIMIT_MAX: getNumber(
    "REFRESH_TOKEN_RATE_LIMIT_MAX",
    30
  ),
  SMS_PROVIDER: getString("SMS_PROVIDER", "mock"),
  LOG_LEVEL: getString("LOG_LEVEL", "info"),
};

if (env.IS_PRODUCTION && env.SMS_PROVIDER === "mock") {
  throw new Error(
    'SMS_PROVIDER="mock" is not allowed when NODE_ENV=production.'
  );
}

module.exports = env;
