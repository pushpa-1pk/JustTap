const { createClient } = require("redis");
const env = require("./env");
const logger = require("./logger");

const redisClient = createClient({
    url: env.redisUrl,
    socket: {
        connectTimeout: env.redisConnectTimeoutMs
    }
});

redisClient.on("connect", () => {
    logger.info("Redis connected");
});

redisClient.on("error", (error) => {
    logger.error("Redis Error", {
        message: error.message
    });
});

const connectRedis = async () => {
    await redisClient.connect();
};

module.exports = {
    redisClient,
    connectRedis
};
