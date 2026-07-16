const config = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/apiError');

module.exports = (err, req, res, next) => {
  let error = err;

  // Enforce native translation if the exception did not derive from structural ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal operational system fault encountered.';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const { statusCode, message } = error;

  const responseEnvelope = {
    success: false,
    error: message,
    ...(config.env === 'development' && { traceStackDump: error.stack })
  };

  // Log contextual records only on unhandled application layer critical failures
  if (statusCode === 500) {
    logger.error(`Critical 500 Interruption Vector: ${error.message} \n Stack trace: ${error.stack}`);
  } else {
    logger.warn(`Operational Application Warning (${statusCode}): ${error.message}`);
  }

  return res.status(statusCode).json(responseEnvelope);
};