const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');
const OutboxPublisherJob = require('./outbox-publisher.job');
const ProviderTimeoutJob = require('./provider-timeout.job');
const OTPCleanupJob = require('./otp-cleanup.job');
const BookingExpiryJob = require('./booking-expiry.job');

const outboxPublisher = new OutboxPublisherJob();
const providerTimeout = new ProviderTimeoutJob();
const otpCleanup = new OTPCleanupJob();
const bookingExpiry = new BookingExpiryJob();

function startBackgroundProcessing() {
  outboxPublisher.start();
  providerTimeout.start();
  otpCleanup.start();
  bookingExpiry.start();
}

async function handleGracefulShutdown(signal) {
  logger.info({ message: `Termination signal ${signal} received. Initiating graceful shutdown sequence.` });

  // 1. Immediately halt new polling ticks
  outboxPublisher.stop();
  providerTimeout.stop();
  otpCleanup.stop();
  bookingExpiry.stop();

  // Allow a 3-second buffer for current worker tasks to finish processing safely
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 2. Disconnect from external connection channels cleanly
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    await mongoose.connection.close();
    logger.info({ message: 'Infrastructure connections closed. Shutdown sequence finished.' });
    process.exit(0);
  } catch (err) {
    logger.error({ message: 'Error encountered during graceful shutdown loop.', error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = { startBackgroundProcessing };
