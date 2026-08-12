const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const env = require("./config/env");
const corsOptions = require("./config/cors");
const logger = require("./services/logger.service");
const requestContextMiddleware = require("./middlewares/request-context.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const { generalRateLimiter } = require("./middlewares/rate-limit.middleware");
const ApiResponse = require("./utils/ApiResponse");
const healthRoutes = require("./routes/health.routes");
const customerProfileRoutes = require("./routes/customer-profile.routes");
const providerProfileRoutes = require("./routes/provider-profile.routes");
const addressRoutes = require("./routes/address.routes");
const providerServiceRoutes = require("./routes/provider-service.routes");
const documentRoutes = require("./routes/document.routes");
const bankDetailsRoutes = require("./routes/bank-details.routes");
const adminRoutes = require("./routes/admin.routes");
const internalRoutes = require("./routes/internal.routes");
const supportRoutes = require("./routes/support.routes");

const app = express();
const uploadsDirectory = path.resolve(__dirname, "..", env.UPLOADS_DIR_NAME);
const publicProfileImagesDirectory = path.join(uploadsDirectory, "profile-images");

app.use(helmet());
app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(generalRateLimiter);
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));
app.use(cookieParser());
app.use(
  `/${env.UPLOADS_DIR_NAME}/profile-images`,
  express.static(publicProfileImagesDirectory)
);
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
    new ApiResponse(200, "Profile Service is running", {
      service: "Profile Service",
      environment: env.NODE_ENV,
    })
  );
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/profiles/customer", customerProfileRoutes);
app.use("/api/v1/profiles/provider", providerProfileRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/provider-services", providerServiceRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/bank-details", bankDetailsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/internal", internalRoutes);
app.use("/api/v1/support", supportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
