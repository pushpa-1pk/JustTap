const winston = require("winston");
const { AsyncLocalStorage } = require("async_hooks");
const env = require("./env");

// Dedicated context pipeline to track transaction variables concurrently across non-blocking runtimes
const logContextStorage = new AsyncLocalStorage();

const SENSITIVE_FIELDS = ["password", "secret", "token", "signature", "authorization", "cvv", "card", "upi"];

function maskSensitiveData(data) {
  if (!data || typeof data !== "object") return data;
  
  const cloned = Array.isArray(data) ? [...data] : { ...data };
  for (const key in cloned) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      cloned[key] = "[MASKED_FINANCIAL_DATA]";
    } else if (typeof cloned[key] === "object") {
      cloned[key] = maskSensitiveData(cloned[key]);
    }
  }
  return cloned;
}

const customFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const context = logContextStorage.getStore() || {};
  
  const logData = {
    timestamp,
    service: env.serviceName,
    environment: env.nodeEnv,
    level: level.toUpperCase(),
    message,
    correlation: {
      requestId: context.requestId || null,
      correlationId: context.correlationId || null,
      bookingId: context.bookingId || null,
      paymentId: context.paymentId || null
    }
  };

  if (Object.keys(meta).length > 0) {
    const cleanMeta = maskSensitiveData(meta);
    if (cleanMeta.error && cleanMeta.error instanceof Error) {
      logData.error = { message: cleanMeta.error.message, stack: cleanMeta.error.stack };
    } else {
      logData.metadata = cleanMeta;
    }
  }

  return JSON.stringify(logData);
});

const logger = winston.createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({ silent: env.nodeEnv === "test" })
  ]
});

module.exports = { logger, logContextStorage };
