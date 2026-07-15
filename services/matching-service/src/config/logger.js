const winston = require("winston");
const env = require("./env");

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: env.SERVICE_NAME, env: env.NODE_ENV },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
