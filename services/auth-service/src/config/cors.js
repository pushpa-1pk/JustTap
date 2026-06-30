const env = require("./env");

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.ALLOWED_ORIGINS.length === 0) {
      return callback(null, true);
    }

    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
};

module.exports = corsOptions;
