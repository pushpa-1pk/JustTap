const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const AppError = require('./utils/app.error');
const globalErrorHandler = require('./middlewares/error.middleware');
const customerCommandRoutes = require('./routes/customer.routes');
const customerQueryRoutes = require('./routes/customer/booking.routes');
const providerCommandRoutes = require('./routes/provider.routes');
const providerQueryRoutes = require('./routes/provider/booking.routes');
const adminBookingRoutes = require('./routes/admin/booking.routes');
const cancellationRoutes = require('./routes/cancellation.routes');
const rescheduleRoutes = require('./routes/reschedule.routes');

const app = express();

// Security Ingress Layer
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10kb' })); // Mitigates large-payload JSON denial-of-service attempts

// Microservice Health Verification Gateway
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: env.serviceName,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/bookings/customer', customerCommandRoutes);
app.use('/api/v1/bookings/customer', customerQueryRoutes);
app.use('/api/v1/bookings/provider', providerCommandRoutes);
app.use('/api/v1/bookings/provider', providerQueryRoutes);
app.use('/api/v1/bookings', cancellationRoutes);
app.use('/api/v1/bookings', rescheduleRoutes);
app.use('/api/v1/admin/bookings', adminBookingRoutes);

// Express 5 rejects the legacy "*" pattern, so keep the not-found handler pathless.
app.use((req, res, next) => {
  next(new AppError(`Interface route ${req.originalUrl} not found on this microservice node.`, 404));
});

// Wire Centralized Error Handler
app.use(globalErrorHandler);

module.exports = app;
