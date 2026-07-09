const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../services/logger.service");

const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI);
  logger.info("MONGODB_CONNECTED");
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("MONGODB_DISCONNECTED");
};

const getDatabaseHealth = async () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseHealth,
};
