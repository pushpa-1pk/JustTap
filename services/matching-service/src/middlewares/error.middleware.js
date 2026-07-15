const env = require("../config/env");
const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const responsePayload = {
    success: false,
    message: err.message || "Internal Discovery Cluster State Failure Context",
    errors: err.errors || []
  };

  if (env.nodeEnv === "development") {
    responsePayload.stack = err.stack;
  }

  logger.error("Matching service exception intercepted", {
    statusCode,
    message: err.message,
    errors: err.errors,
    path: req.originalUrl,
    method: req.method
  });

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;