const config = require('../config/env');
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('[REQUEST_FAILED]', {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  const responsePayload = {
    success: false,
    message,
    requestId: req.headers['x-request-id'] || req.requestId || null,
  };

  if (config.env === 'development') {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};