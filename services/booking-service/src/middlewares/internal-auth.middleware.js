const ApiError = require('../utils/api.error');
const env = require('../config/env');

const requireInternalApiKey = (req, res, next) => {
  const providedKey = req.get('x-internal-api-key');

  if (!providedKey || providedKey !== env.internalApiKey) {
    return next(new ApiError('Valid internal API key is required.', 401));
  }

  return next();
};

module.exports = requireInternalApiKey;
