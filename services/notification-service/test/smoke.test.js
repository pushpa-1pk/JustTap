const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '4005';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/justtap_notification_test';
process.env.REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6380';
process.env.RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://127.0.0.1:5672';
process.env.JWT_SECRET = process.env.JWT_SECRET || '12345678901234567890123456789012';
process.env.PRIMARY_SMS_PROVIDER = process.env.PRIMARY_SMS_PROVIDER || 'msg91';
process.env.MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || 'test-key';
process.env.MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'JUSTAP';

test('notification app module loads', async () => {
  const app = require('../src/app');
  assert.ok(app);
});

test('booking accepted handler maps booking event', async () => {
  const BookingAcceptedHandler = require('../src/events/handlers/bookingAccepted.handler');
  const handler = new BookingAcceptedHandler();
  const meta = handler.extractMeta({ bookingId: 'b1', providerName: 'Test Provider' });

  assert.equal(handler.eventType, 'booking.accepted');
  assert.equal(meta.templateName, 'booking.accepted');
  assert.deepEqual(meta.channels, ['PUSH', 'IN_APP']);
});

test('payment success handler keeps email for financial proof', async () => {
  const PaymentSuccessHandler = require('../src/events/handlers/paymentSuccess.handler');
  const handler = new PaymentSuccessHandler();
  const meta = handler.extractMeta({ amount: 250, transactionId: 'txn_123', email: 'user@example.com' });

  assert.equal(handler.eventType, 'payment.success');
  assert.deepEqual(meta.channels, ['PUSH', 'IN_APP', 'EMAIL']);
});

test('refund and wallet handlers use cost-efficient channel policy', async () => {
  const PaymentRefundedHandler = require('../src/events/handlers/paymentRefunded.handler');
  const WalletCreditHandler = require('../src/events/handlers/walletCredit.handler');
  const WalletDebitHandler = require('../src/events/handlers/walletDebit.handler');

  assert.deepEqual(
    new PaymentRefundedHandler().extractMeta({ amount: 99, refundId: 'rf_1', email: 'user@example.com' }).channels,
    ['PUSH', 'IN_APP', 'EMAIL']
  );
  assert.deepEqual(
    new WalletCreditHandler().extractMeta({ amount: 50, balance: 300 }).channels,
    ['PUSH', 'IN_APP']
  );
  assert.deepEqual(
    new WalletDebitHandler().extractMeta({ amount: 25, balance: 275 }).channels,
    ['PUSH', 'IN_APP']
  );
});

test('arrival, service, and security handlers use appropriate channels', async () => {
  const TrackingArrivedHandler = require('../src/events/handlers/trackingArrived.handler');
  const BookingStartedHandler = require('../src/events/handlers/bookingStarted.handler');
  const BookingCompletedHandler = require('../src/events/handlers/bookingCompleted.handler');
  const AuthSecurityHandler = require('../src/events/handlers/authSecurity.handler');

  assert.deepEqual(
    new TrackingArrivedHandler().extractMeta({ providerName: 'Raj' }).channels,
    ['PUSH', 'IN_APP']
  );
  assert.deepEqual(
    new BookingStartedHandler().extractMeta({ providerName: 'Raj' }).channels,
    ['PUSH', 'IN_APP']
  );
  assert.deepEqual(
    new BookingCompletedHandler().extractMeta({ providerName: 'Raj' }).channels,
    ['PUSH', 'IN_APP']
  );
  assert.deepEqual(
    new AuthSecurityHandler().extractMeta({ action: 'New login', email: 'a@b.com' }).channels,
    ['PUSH', 'EMAIL']
  );
});
