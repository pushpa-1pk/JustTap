const { logger } = require("../config/logger");

const logOperationalTelemetry = (req, res, next) => {
  const HR_START_TIME = process.hrtime();

  // Intercept the outbound write execution completion event stream signature hook
  res.on("finish", () => {
    const hrDurationDiff = process.hrtime(HR_START_TIME);
    // Convert high-resolution duration array to exact milliseconds values
    const executionDurationMs = (hrDurationDiff[0] * 1000 + hrDurationDiff[1] / 1000000).toFixed(2);

    logger.info(`[TELEMETRY] Outbound payload pipeline delivered`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: `${executionDurationMs}ms`
    });
  });

  next();
};

module.exports = logOperationalTelemetry;