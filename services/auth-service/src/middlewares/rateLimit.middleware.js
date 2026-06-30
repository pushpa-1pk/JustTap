const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const env = require("../config/env");
const { normalizePhoneNumber } = require("../utils/phone.util");

const buildKeyGenerator = (suffixResolver) => {
  return (req) => {
    const suffix = suffixResolver(req);
    return `${ipKeyGenerator(req.ip)}:${suffix}`;
  };
};

const safePhone = (value) => {
  try {
    return normalizePhoneNumber(value);
  } catch (error) {
    return "invalid-phone";
  }
};

const authRateLimiter = ({
  windowMs,
  max,
  message,
  keyGenerator,
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: {
      success: false,
      message,
    },
  });

const sendOtpRateLimiter = authRateLimiter({
  windowMs: env.SEND_OTP_RATE_LIMIT_WINDOW_MS,
  max: env.SEND_OTP_RATE_LIMIT_MAX,
  message: "Too many OTP requests. Please try again later.",
  keyGenerator: buildKeyGenerator((req) => safePhone(req.body.phone)),
});

const verifyOtpRateLimiter = authRateLimiter({
  windowMs: env.VERIFY_OTP_RATE_LIMIT_WINDOW_MS,
  max: env.VERIFY_OTP_RATE_LIMIT_MAX,
  message: "Too many OTP verification attempts. Please try again later.",
  keyGenerator: buildKeyGenerator((req) => safePhone(req.body.phone)),
});

const refreshTokenRateLimiter = authRateLimiter({
  windowMs: env.REFRESH_TOKEN_RATE_LIMIT_WINDOW_MS,
  max: env.REFRESH_TOKEN_RATE_LIMIT_MAX,
  message: "Too many token refresh attempts. Please try again later.",
  keyGenerator: buildKeyGenerator(
    (req) => req.body.deviceId || "unknown-device"
  ),
});

module.exports = {
  sendOtpRateLimiter,
  verifyOtpRateLimiter,
  refreshTokenRateLimiter,
};
