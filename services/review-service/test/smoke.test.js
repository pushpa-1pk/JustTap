const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "5006";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/justtap_review_test";
process.env.RABBITMQ_URI = process.env.RABBITMQ_URI || "amqp://127.0.0.1:5672";
process.env.RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || "justtap.events";
process.env.JWT_SECRET = process.env.JWT_SECRET || "12345678901234567890123456789012";
process.env.BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://127.0.0.1:3001";
process.env.PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || "http://127.0.0.1:4001";
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "justtap-internal-dev-key";

test("review app module loads", async () => {
  const app = require("../src/app");
  assert.ok(app);
});

test("review env exposes downstream service URLs", async () => {
  const config = require("../src/config/env");
  assert.equal(config.rabbitmq.exchanges.events, "justtap.events");
  assert.equal(config.services.bookingServiceUrl, "http://127.0.0.1:3001");
});

test("review publisher uses justtap events exchange", async () => {
  const rabbitmqConfig = require("../src/config/rabbitmq");
  const publisher = require("../src/events/publishers/review.publisher");
  const published = [];

  rabbitmqConfig.getChannel = () => ({
    publish: (...args) => {
      published.push(args);
      return true;
    }
  });

  await publisher.publishRatingUpdated("provider-1", {
    averageRating: 4.5,
    totalReviews: 10,
    ratingBreakdown: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 6 }
  });

  assert.equal(published.length, 1);
  assert.equal(published[0][0], "justtap.events");
  assert.equal(published[0][1], "provider.rating.updated");
});
