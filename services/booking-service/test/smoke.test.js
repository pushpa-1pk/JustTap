const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/justtap_booking_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '12345678901234567890123456789012';
process.env.RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://127.0.0.1:5672';

test('booking env loads with rabbitmq defaults', async () => {
  const env = require('../src/config/env');
  assert.equal(env.rabbitmqExchange, 'justtap.events');
});

test('notification publisher maps booking acceptance events', async () => {
  const publisher = require('../src/events/notification.publisher');
  const published = [];
  publisher.connect = async () => ({
    publish: (...args) => {
      published.push(args);
      return true;
    }
  });

  await publisher.publish('BOOKING_ACCEPTED', {
    bookingId: 'booking-1',
    bookingNumber: 'BK-001',
    customerId: 'customer-1',
    providerId: 'provider-1',
    providerName: 'Jay Malhar Services'
  });

  assert.equal(published.length, 1);
  assert.equal(published[0][1], 'booking.accepted');

  const body = JSON.parse(published[0][2].toString());
  assert.equal(body.userId, 'customer-1');
  assert.equal(body.payload.providerName, 'Jay Malhar Services');
});
