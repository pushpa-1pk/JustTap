const env = require("../config/env");
const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  logger.error("REQUEST_FAILED", {
    statusCode,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  const responsePayload = {
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.headers["x-request-id"] || req.requestId || null,
  };

  if (env.NODE_ENV === "development") {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;