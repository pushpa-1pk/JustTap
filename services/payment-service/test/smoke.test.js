const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/justtap_payment_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "12345678901234567890123456789012";
process.env.JWT_ISSUER = process.env.JWT_ISSUER || "justtap-auth";
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || "justtap-clients";
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_test";
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "justtap-internal-dev-key";
process.env.RABBITMQ_URI = process.env.RABBITMQ_URI || "amqp://127.0.0.1:5672";

test("app module loads with test configuration", async () => {
  const app = require("../src/app");
  assert.ok(app);
});

test("outbox model compiles cleanly", async () => {
  const OutboxEvent = require("../src/models/outboxEvent.model");
  assert.equal(OutboxEvent.modelName, "OutboxEvent");
});

test("rabbitmq broker maps payment capture events to notification envelope", async () => {
  const broker = require("../src/events/rabbitmqBroker");
  const publication = broker._normalizeEvent("payment.captured", {
    meta: { correlationId: "corr-1" },
    data: {
      customerId: "customer-1",
      bookingId: "booking-1",
      gatewayPaymentId: "pay_123",
      amountPaidPaise: 259900,
      paymentMethod: "upi"
    }
  });

  assert.equal(publication.routingKey, "payment.success");
  assert.equal(publication.body.userId, "customer-1");
  assert.equal(publication.body.payload.transactionId, "pay_123");
  assert.equal(publication.body.payload.amount, 2599);
});

test("rabbitmq broker maps wallet updates by direction", async () => {
  const broker = require("../src/events/rabbitmqBroker");
  const publication = broker._normalizeEvent("wallet.updated", {
    data: {
      providerId: "provider-1",
      ledgerEntryId: "ledger-1",
      amountPaise: 5000,
      direction: "DEBIT",
      balanceType: "AVAILABLE",
      availableBalancePaise: 45000,
      pendingBalancePaise: 12000
    }
  });

  assert.equal(publication.routingKey, "wallet.debit");
  assert.equal(publication.body.userId, "provider-1");
  assert.equal(publication.body.payload.amount, 50);
  assert.equal(publication.body.payload.balance, 450);
});
