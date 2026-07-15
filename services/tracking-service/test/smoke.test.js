const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '5004';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/justtap_tracking_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '12345678901234567890123456789012';
process.env.BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://127.0.0.1:3001';
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'justtap-internal-dev-key';
process.env.RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://127.0.0.1:5672';

test('tracking env loads with rabbitmq defaults', async () => {
  const config = require('../src/config/env');
  assert.equal(config.rabbitmqExchange, 'justtap.events');
});

test('tracking notification publisher emits tracking.arrived events', async () => {
  const publisher = require('../src/services/notificationPublisher.service');
  const published = [];
  publisher.connect = async () => ({
    publish: (...args) => {
      published.push(args);
      return true;
    }
  });

  await publisher.publishArrival({
    bookingId: 'booking-1',
    customerId: 'customer-1',
    providerId: 'provider-1',
    providerName: 'Jay Malhar Services',
    distanceMeters: 42
  });

  assert.equal(published.length, 1);
  assert.equal(published[0][1], 'tracking.arrived');

  const body = JSON.parse(published[0][2].toString());
  assert.equal(body.userId, 'customer-1');
  assert.equal(body.payload.distanceMeters, 42);
});
