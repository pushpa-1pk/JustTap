const ApiError = require("../utils/ApiError");

const buckets = new Map();

const getBucketKey = (scope, req) => {
  const userKey = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  return `${scope}:${userKey}`;
};

const buildLimiter = ({ scope, windowMs, max }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getBucketKey(scope, req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (bucket.count >= max) {
      return next(new ApiError(429, "Too many requests. Please try again later."));
    }

    bucket.count += 1;
    return next();
  };
};

const generalRateLimiter = buildLimiter({
  scope: "general",
  windowMs: 60 * 1000,
  max: 100,
});

const providerRateLimiter = buildLimiter({
  scope: "provider",
  windowMs: 60 * 1000,
  max: 30,
});

const adminRateLimiter = buildLimiter({
  scope: "admin",
  windowMs: 60 * 1000,
  max: 20,
});

module.exports = {
  generalRateLimiter,
  providerRateLimiter,
  adminRateLimiter,
};
