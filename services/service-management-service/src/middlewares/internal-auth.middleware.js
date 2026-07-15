const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const requireInternalApiKey = (req, res, next) => {
  const providedKey = req.get("x-internal-api-key");

  if (!providedKey || providedKey !== env.INTERNAL_API_KEY) {
    return next(new ApiError(401, "Valid internal API key is required."));
  }

  return next();
};

module.exports = {
  requireInternalApiKey,
};
