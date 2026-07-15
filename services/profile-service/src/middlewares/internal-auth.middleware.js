const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("./auth.middleware");

const requireInternalApiKey = (req, res, next) => {
  const providedKey = req.get("x-internal-api-key");

  if (!providedKey || providedKey !== env.INTERNAL_API_KEY) {
    return next(new ApiError(401, "Valid internal API key is required."));
  }

  return next();
};

const allowInternalOrAuthenticated = (req, res, next) => {
  const providedKey = req.get("x-internal-api-key");

  if (providedKey && providedKey === env.INTERNAL_API_KEY) {
    return next();
  }

  return verifyToken(req, res, next);
};

module.exports = {
  requireInternalApiKey,
  allowInternalOrAuthenticated,
};
