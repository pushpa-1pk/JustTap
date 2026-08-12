const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const corsOptions = require("./config/cors");
const logger = require("./services/logger.service");
const requestContextMiddleware = require("./middlewares/request-context.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const internalRoutes = require("./routes/internal.routes");
const ApiResponse = require("./utils/ApiResponse");

const app = express();

app.use(helmet());
app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));
app.use(cookieParser());
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
    new ApiResponse(200, "Auth Service is running", {
      service: "Auth Service",
      environment: env.NODE_ENV,
    })
  );
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/internal", internalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
