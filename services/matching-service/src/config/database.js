const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

let listenersAttached = false;

const attachListeners = () => {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    logger.info("mongoose_connected");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("mongoose_error", { message: error.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("mongoose_disconnected");
  });
};

const connectDatabase = async () => {
  attachListeners();

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: !env.IS_PRODUCTION,
    serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: env.MONGO_SOCKET_TIMEOUT_MS,
  });
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
