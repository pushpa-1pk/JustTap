const mongoose = require("mongoose");
const env = require("./env");
const { logger } = require("./logger");

let isHealthValid = false;

const connectDatabase = async () => {
  const options = {
    autoIndex: env.database.autoIndex,
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000
  };

  const retryDelays = [1000, 2000, 5000, 10000];
  let attempt = 0;

  mongoose.connection.on("connected", () => {
    isHealthValid = true;
    logger.info("MongoDB cluster connection fully established and operational");
  });

  mongoose.connection.on("error", (err) => {
    isHealthValid = false;
    logger.error("MongoDB storage layer encountered an internal runtime exception", { error: err });
  });

  mongoose.connection.on("disconnected", () => {
    isHealthValid = false;
    logger.warn("MongoDB storage cluster disconnected");
  });

  while (attempt < retryDelays.length) {
    try {
      await mongoose.connect(env.database.uri, options);
      return;
    } catch (error) {
      attempt++;
      isHealthValid = false;
      logger.error(`MongoDB connection retry failure (Attempt ${attempt}/${retryDelays.length})`, { error });
      
      if (attempt >= retryDelays.length) {
        logger.error("[CRITICAL] MongoDB reconnection limits exhausted. Crashing target pod process.");
        throw error;
      }
      
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt - 1]));
    }
  }
};

const disconnectDatabase = async () => {
  logger.info("Initiating structural disconnect of MongoDB pool...");
  await mongoose.disconnect();
  isHealthValid = false;
  logger.info("MongoDB connection layer safely terminated");
};

const checkDatabaseHealth = () => isHealthValid && mongoose.connection.readyState === 1;

module.exports = { connectDatabase, disconnectDatabase, checkDatabaseHealth };