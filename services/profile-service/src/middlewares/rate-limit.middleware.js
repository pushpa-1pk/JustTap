const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

const generalRateLimiter = buildLimiter({
  windowMs: env.GENERAL_RATE_LIMIT_WINDOW_MS,
  max: env.GENERAL_RATE_LIMIT_MAX,
  message: "Too many requests. Please try again later.",
});

const providerRateLimiter = buildLimiter({
  windowMs: env.PROVIDER_RATE_LIMIT_WINDOW_MS,
  max: env.PROVIDER_RATE_LIMIT_MAX,
  message: "Too many provider requests. Please try again later.",
});

const adminRateLimiter = buildLimiter({
  windowMs: env.ADMIN_RATE_LIMIT_WINDOW_MS,
  max: env.ADMIN_RATE_LIMIT_MAX,
  message: "Too many admin requests. Please try again later.",
});

module.exports = {
  generalRateLimiter,
  providerRateLimiter,
  adminRateLimiter,
};
