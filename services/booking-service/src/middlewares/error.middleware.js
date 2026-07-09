const logger = require('../config/logger');
const env = require('../config/env');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Structure internal logging metadata
  logger.error(err.message, {
    status: err.status,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.headers['x-request-id'] || 'N/A'
  });

  if (env.nodeEnv === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // Production Execution: Leak no technical platform details
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'A critical internal operational error occurred.'
  });
};