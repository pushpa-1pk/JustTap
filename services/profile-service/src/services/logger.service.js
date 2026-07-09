const env = require("../config/env");
const requestContext = require("./request-context.service");

const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class LoggerService {
  shouldLog(level) {
    const configuredLevel = String(env.LOG_LEVEL || "info").toLowerCase();
    return (
      LEVEL_PRIORITY[level] <=
      (LEVEL_PRIORITY[configuredLevel] ?? LEVEL_PRIORITY.info)
    );
  }

  write(level, message, data = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const context = requestContext.getContext();
    const payload = {
      level: level.toUpperCase(),
      timestamp: new Date().toISOString(),
      message,
      requestId: context.requestId || null,
      data,
    };
    const line = `${JSON.stringify(payload)}\n`;

    if (level === "error") {
      process.stderr.write(line);
      return;
    }

    process.stdout.write(line);
  }

  info(message, data = {}) {
    this.write("info", message, data);
  }

  warn(message, data = {}) {
    this.write("warn", message, data);
  }

  error(message, data = {}) {
    this.write("error", message, data);
  }

  debug(message, data = {}) {
    this.write("debug", message, data);
  }
}

module.exports = new LoggerService();
