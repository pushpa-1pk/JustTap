const { redisClient } = require("../config/redis");
const env = require("../config/env");
const keys = require("../constants/redisKeys");
const ApiError = require("../utils/ApiError");

const locationRateLimiter = async (req, res, next) => {
  const providerId = req.user?.userId;
  if (!providerId) {
    return next(new ApiError("Authenticated provider context is required.", 401));
  }

  const key = keys.rateLocation(providerId);
  const now = Date.now();
  const windowMsec = env.LOCATION_RATE_LIMIT_WINDOW_MS;

  try {
    const responses = await redisClient
      .multi()
      .zRemRangeByScore(key, 0, now - windowMsec)
      .zAdd(key, { score: now, value: `${now}:${Math.random()}` })
      .zCard(key)
      .pExpire(key, windowMsec + 5000)
      .exec();

    const requestCount = Array.isArray(responses?.[2]) ? responses[2][1] : responses?.[2];

    if (Number(requestCount) > env.LOCATION_RATE_LIMIT_MAX) {
      return next(
        new ApiError(
          `Rate limit exceeded. Maximum ${env.LOCATION_RATE_LIMIT_MAX} location updates per window allowed.`,
          429
        )
      );
    }

    return next();
  } catch (error) {
    return next(new ApiError("Unable to enforce location rate limiting.", 503));
  }
};

module.exports = { locationRateLimiter };
