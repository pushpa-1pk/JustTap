const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const customerRoutes = require('./routes/customer.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiError = require('./utils/apiError');

const app = express();

const sanitizeNoSqlPayload = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeNoSqlPayload);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    const sanitizedKey = key.replace(/\$/g, '').replace(/\./g, '');
    acc[sanitizedKey] = sanitizeNoSqlPayload(nestedValue);
    return acc;
  }, {});
};

// 1. Production Hardening Layer (HTTP Headers Configuration)
app.use(helmet());

// 2. Cross-Origin Ingress Limits
app.use(cors({
  origin: config.env === 'production' ? ['https://justtap.in', 'https://admin.justtap.in'] : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Request Preprocessing & Anti-Injection Sanitizers
app.use(express.json({ limit: '10kb' })); // Mitigate Large JSON payload DOS attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use((req, res, next) => {
  req.body = sanitizeNoSqlPayload(req.body);
  req.params = sanitizeNoSqlPayload(req.params);
  next();
});

// 4. Ingress Rate Limiter (Protects REST APIs from scraping/flooding)
const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minute window block
  max: config.env === 'production' ? 100 : 1000,
  message: { success: false, error: 'Too many requests submitted. Backoff and retry later.' },
  standardHeaders: true,
  legacyHeaders: false
});

if (config.env !== 'test') {
  app.use('/api/', standardApiLimiter);
}

// 5. Bare-Metal Cluster Diagnostics (Kubernetes Probes)
app.get('/live', (req, res) => res.status(200).send('OK'));
app.get('/ready', (req, res) => {
  // Verifies database connection pool states dynamically
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({ status: 'READY', dynamicServices: { database: 'CONNECTED' } });
  }
  return res.status(503).json({ status: 'NOT_READY', dynamicServices: { database: 'DISCONNECTED' } });
});

// 6. Microservice Routing Segment Mounting Points
app.use('/api/v1/reviews', customerRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

// 7. Route Miss Fallback
app.use((req, res, next) => {
  next(new ApiError(404, `Requested URI route plane path [${req.originalUrl}] does not exist.`));
});

// 8. Global Centralized Error Interceptor Stack
app.use(errorMiddleware);

module.exports = app;
