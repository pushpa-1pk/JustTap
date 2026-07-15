const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const env = require("./config/env");
const routes = require("./routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const ApiResponse = require("./utils/ApiResponse");
const { redisClient } = require("./config/redis");
const mongoose = require("mongoose");

const app = express();

const resolvedOrigins = env.ALLOWED_ORIGINS.length
  ? env.ALLOWED_ORIGINS
  : env.CORS_ORIGIN
    ? [env.CORS_ORIGIN]
    : [];

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !resolvedOrigins.length || resolvedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS policy"));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

app.get("/health", (req, res) => {
  new ApiResponse(200, "Matching service is healthy", {
    service: env.SERVICE_NAME,
    status: "ok",
    timestamp: new Date().toISOString(),
  }).send(res);
});

app.get("/ready", (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = redisClient.isReady;
  const ready = mongoReady && redisReady;

  return res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? "Matching service is ready" : "Matching service dependencies are not ready",
    data: {
      mongoReady,
      redisReady,
    },
  });
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
