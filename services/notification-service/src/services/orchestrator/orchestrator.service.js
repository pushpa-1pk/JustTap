const BookingAcceptedHandler = require('../../events/handlers/bookingAccepted.handler');
const PaymentSuccessHandler = require('../../events/handlers/paymentSuccess.handler');
const PaymentRefundedHandler = require('../../events/handlers/paymentRefunded.handler');
const WalletCreditHandler = require('../../events/handlers/walletCredit.handler');
const WalletDebitHandler = require('../../events/handlers/walletDebit.handler');
const TrackingArrivedHandler = require('../../events/handlers/trackingArrived.handler');
const BookingStartedHandler = require('../../events/handlers/bookingStarted.handler');
const BookingCompletedHandler = require('../../events/handlers/bookingCompleted.handler');
const AuthSecurityHandler = require('../../events/handlers/authSecurity.handler');
const { STATUSES } = require('../../constants/notification.constants');

class NotificationOrchestrator {
  constructor(redis, preferenceRepo, notificationRepo, templateEngine, dispatcherService, logger) {
    this.redis = redis;
    this.preferenceRepo = preferenceRepo;
    this.notificationRepo = notificationRepo;
    this.templateEngine = templateEngine;
    this.dispatcher = dispatcherService;
    this.logger = logger;
    this.handlers = {};

    this.registerHandler(new BookingAcceptedHandler());
    this.registerHandler(new PaymentSuccessHandler());
    this.registerHandler(new PaymentRefundedHandler());
    this.registerHandler(new WalletCreditHandler());
    this.registerHandler(new WalletDebitHandler());
    this.registerHandler(new TrackingArrivedHandler());
    this.registerHandler(new BookingStartedHandler());
    this.registerHandler(new BookingCompletedHandler());
    this.registerHandler(new AuthSecurityHandler());
  }

  registerHandler(handler) {
    this.handlers[handler.eventType] = handler;
  }

  async processIncomingEvent(eventType, rawEvent) {
    const { eventId, userId, payload } = rawEvent;

    // 1. Atomic Deduplication Guard (60s Key Expiry window)
    const idempotencyKey = `notification:dedupe:${userId}:${eventType}:${payload.bookingId || payload.transactionId || eventId}`;
    const acquiredLock = await this.redis.set(idempotencyKey, 'PENDING_DISPATCH', 'EX', 60, 'NX');
    if (!acquiredLock) {
      this.logger.warn(`Idempotency verification active. Suppressing duplicate event packet: ${idempotencyKey}`);
      return;
    }

    const handler = this.handlers[eventType];
    if (!handler) {
      this.logger.error(`Agnostic mapping dropped. Unhandled dynamic type execution context: ${eventType}`);
      return;
    }

    // 2. Load preferences matrix
    const preferences = await this.preferenceRepo.resolveUserPreferences(userId);
    const category = handler.getCategory();

    if (!preferences.categories[category]) {
      this.logger.info(`Notification dropped: User opted out of category [${category}]`);
      return;
    }

    // 3. Process structural transforms and interpolate dynamic localization parameters
    const mappedConfig = handler.extractMeta(payload);
    const rendered = this.templateEngine.render(mappedConfig.templateName, preferences.language, mappedConfig.templateVars);

    // 4. Create Ledger Document
    const notification = await this.notificationRepo.create({
      userId,
      eventType,
      title: rendered.title,
      body: rendered.body,
      priority: mappedConfig.priority,
      status: STATUSES.CREATED,
      channels: mappedConfig.channels,
      metadata: mappedConfig.metadata
    });

    // 5. Delegate multi-channel distribution tasks to the Dispatcher
    await this.dispatcher.dispatchToChannels(notification, preferences, rendered);
  }
}

module.exports = NotificationOrchestrator;
