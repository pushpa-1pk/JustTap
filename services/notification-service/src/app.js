const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const initRoutes = require('./routes/notification.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/v1/notifications', initRoutes());

app.get('/health/live', (req, res) => res.status(200).send('HEALTHY'));
app.get('/health/ready', (req, res) => res.status(200).json({ status: 'READY' }));

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
