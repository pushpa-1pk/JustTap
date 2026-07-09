const logger = require("../services/logger.service");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error("REQUEST_FAILED", {
    statusCode,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.requestId || null,
  });
};
