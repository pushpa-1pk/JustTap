const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const ApiResponse = require('./utils/ApiResponse');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins.length ? config.allowedOrigins : true,
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// High-performance heartbeat cloud system status check routing node
app.get('/health', (req, res) => {
  res.status(200).json(new ApiResponse(200, {
    status: 'running',
    service: 'tracking-service',
    timestamp: new Date()
  }, 'Tracking microservice telemetry engine heartbeat verified online.'));
});


// Resource Not Found catching fallback node
app.use((req, res, next) => {
  next(new ApiError(404, `Target endpoint requested path [${req.originalUrl}] does not map to any microservice infrastructure node.`));
});

const errorMiddleware = require('./middlewares/error.middleware');

// Global Centralized Error Interceptor
app.use(errorMiddleware);

module.exports = app;
