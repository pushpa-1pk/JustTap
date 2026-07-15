const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { v4: uuidv4 } = require("uuid");
const env = require("./config/env");
const { logContextStorage } = require("./config/logger");
const errorMiddleware = require("./middlewares/error.middleware");
const telemetryMiddleware = require("./middlewares/telemetry.middleware");
const paymentRouter = require("./routes/payment.routes");
const webhookRouter = require("./routes/webhook.routes");

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.security.corsOrigin }));

app.use("/webhooks", webhookRouter);
app.use(express.json());
app.use(telemetryMiddleware);

app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || `req-${uuidv4()}`;
  const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;

  res.setHeader("X-Correlation-ID", correlationId);

  const context = {
    requestId,
    correlationId,
    bookingId: req.headers["x-booking-id"] || req.body?.bookingId || null,
    paymentId: req.headers["x-payment-id"] || req.body?.paymentId || null
  };

  logContextStorage.run(context, () => next());
});

app.use("/api/v1/payments", paymentRouter);

module.exports = app;
