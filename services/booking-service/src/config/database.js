const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

const connectDatabase = async () => {
    try {
        await mongoose.connect(env.mongoUri, {
            serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
            socketTimeoutMS: env.mongoSocketTimeoutMs
        });

        logger.info("MongoDB connected successfully");
    } catch (error) {
        logger.error("MongoDB connection failed", {
            message: error.message
        });

        process.exit(1);
    }
};

module.exports = connectDatabase;
