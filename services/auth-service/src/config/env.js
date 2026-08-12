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
  JWT_ISSUER: getString("JWT_ISSUER", "justtap-auth"),
  JWT_AUDIENCE: getString("JWT_AUDIENCE", "justtap-clients"),
  ACCESS_TOKEN_EXPIRES: getString("ACCESS_TOKEN_EXPIRES", "15m"),
  REFRESH_TOKEN_EXPIRES: getString("REFRESH_TOKEN_EXPIRES", "30d"),
  JSON_BODY_LIMIT: getString("JSON_BODY_LIMIT", "100kb"),
  ALLOWED_ORIGINS: getList("ALLOWED_ORIGINS"),
  INTERNAL_API_KEY: getString(
    "INTERNAL_API_KEY",
    NODE_ENV === "production" ? "" : "justtap-internal-dev-key"
  ),
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
  MSG91_AUTH_KEY: getString("MSG91_AUTH_KEY"),
  MSG91_SENDER_ID: getString("MSG91_SENDER_ID"),
  MSG91_ROUTE: getString("MSG91_ROUTE", "4"),
  MSG91_COUNTRY: getString("MSG91_COUNTRY", "91"),
  MSG91_DLT_TEMPLATE_ID: getString("MSG91_DLT_TEMPLATE_ID"),
  TWILIO_ACCOUNT_SID: getString("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: getString("TWILIO_AUTH_TOKEN"),
  TWILIO_FROM_NUMBER: getString("TWILIO_FROM_NUMBER"),
  LOG_LEVEL: getString("LOG_LEVEL", "info"),
};

if (env.IS_PRODUCTION && !env.INTERNAL_API_KEY) {
  throw new Error(
    "Missing required environment variable: INTERNAL_API_KEY"
  );
}

if (env.IS_PRODUCTION && env.SMS_PROVIDER === "mock") {
  throw new Error(
    'SMS_PROVIDER="mock" is not allowed when NODE_ENV=production.'
  );
}

if (env.SMS_PROVIDER === "twilio") {
  ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"].forEach(
    (key) => {
      if (!env[key]) {
        throw new Error(
          `Missing required environment variable for SMS_PROVIDER=twilio: ${key}`
        );
      }
    }
  );
}

if (env.SMS_PROVIDER === "msg91") {
  ["MSG91_AUTH_KEY", "MSG91_SENDER_ID"].forEach((key) => {
    if (!env[key]) {
      throw new Error(
        `Missing required environment variable for SMS_PROVIDER=msg91: ${key}`
      );
    }
  });
}

module.exports = env;
