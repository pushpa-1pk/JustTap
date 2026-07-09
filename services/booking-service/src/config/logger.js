const winston = require("winston");
const env = require("./env");

const logger = winston.createLogger({
    level: env.logLevel,

    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),

    defaultMeta: {
        service: env.serviceName
    },

    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;