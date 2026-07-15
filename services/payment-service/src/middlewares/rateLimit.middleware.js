const { redisClient } = require("../config/redis");
const ApiError = require("../utils/ApiError");

/**
 * Differentiated Redis-Backed Fixed Window Rate Limiting Generator
 * @param {string} routeId Isolated tracking index string identifier
 * @param {number} windowSeconds Temporal evaluation window boundaries
 * @param {number} maxRequests Upper allocation processing limit bounds
 */
const createRateLimiter = (routeId, windowSeconds, maxRequests) => {
  return async (req, res, next) => {
    const clientIpIdentifier = req.ip || req.headers["x-forwarded-for"] || "UNKNOWN_HOST";
    const redisTrackingKey = `ratelimit:${routeId}:${clientIpIdentifier}`;

    try {
      const activeHits = await redisClient.incr(redisTrackingKey);
      
      if (activeHits === 1) {
        await redisClient.expire(redisTrackingKey, windowSeconds);
      }

      if (activeHits > maxRequests) {
        return next(new ApiError(429, `Rate limit exceeded on financial interface [${routeId}]. Retry again later.`));
      }
      return next();
    } catch (err) {
      // If the cache cluster dips, pass cleanly to prioritize payment loop accessibility
      next(); 
    }
  };
};

module.exports = {
  orderCreationLimiter: createRateLimiter("ORDER_INIT", 60, 20),   // 20 requests per minute ceiling
  checkoutVerifyLimiter: createRateLimiter("CHECKOUT_VER", 60, 10), // 10 checkouts per minute ceiling
  withdrawalLimiter: createRateLimiter("WITHDRAW_EXEC", 60, 2)     // Max 2 cash-out attempts per minute
};