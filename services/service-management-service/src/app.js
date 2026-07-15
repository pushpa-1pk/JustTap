const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const corsOptions = require("./config/cors");
const logger = require("./services/logger.service");
const requestContextMiddleware = require("./middlewares/request-context.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const { generalRateLimiter } = require("./middlewares/rate-limit.middleware");
const ApiResponse = require("./utils/ApiResponse");
const healthRoutes = require("./routes/health.routes");
const adminRoutes = require("./routes/admin.routes");
const providerRoutes = require("./routes/provider.routes");
const catalogRoutes = require("./routes/catalog.routes");
const internalRoutes = require("./routes/internal.routes");

const app = express();

app.use(helmet());
app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(generalRateLimiter);
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));
app.use(
  morgan("combined", {
    stream: {
      write(message) {
        logger.info("HTTP_REQUEST", {
          message: message.trim(),
        });
      },
    },
  })
);

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Service Management Service is running", {
      service: "Service Management Service",
      environment: env.NODE_ENV,
    })
  );
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/provider", providerRoutes);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1/internal", internalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
