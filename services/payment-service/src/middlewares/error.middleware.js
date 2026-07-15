const { logger } = require("../config/logger");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

function errorMiddleware(error, req, res, next) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Internal server error.";
  const errors = error instanceof ApiError ? error.errors : [];

  logger.error("Payment service request failed", {
    error,
    method: req.method,
    url: req.originalUrl,
    statusCode
  });

  return res.status(statusCode).json(
    new ApiResponse(statusCode, null, message, { errors })
  );
}

module.exports = errorMiddleware;
