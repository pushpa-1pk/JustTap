const env = require('../config/env');
const Redis = require('ioredis');
const logger = require('../config/logger');

const NotificationRepository = require('../repositories/notification.repository');
const PreferenceRepository = require('../repositories/preference.repository');
const DeviceRepository = require('../repositories/device.repository');
const DeliveryRepository = require('../repositories/delivery.repository');

const FcmAdapter = require('../adapters/firebase/fcm.adapter');
const ResendAdapter = require('../adapters/email/resend.adapter');
const TwilioAdapter = require('../adapters/sms/twilio.adapter');
const Msg91Adapter = require('../adapters/sms/msg91.adapter');

const PushChannel = require('../services/delivery/push/pushChannel');
const EmailChannel = require('../services/delivery/email/emailChannel');
const SmsChannel = require('../services/delivery/sms/smsChannel');
const InAppChannel = require('../services/delivery/inapp/inAppChannel');

const DispatcherService = require('../services/dispatcher/dispatcher.service');
const TemplateEngine = require('../services/template/engine.service');
const NotificationOrchestrator = require('../services/orchestrator/orchestrator.service');

class Container {
  constructor() {
    this.instances = new Map();
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.build();
    return this.initPromise;
  }

  async build() {
    logger.info('Constructing notification-service dependency graph.');

    const redis = new Redis(env.REDIS_URI, { maxRetriesPerRequest: null });
    this.instances.set('redis', redis);
    this.instances.set('env', env);
    this.instances.set('logger', logger);

    const notificationRepo = new NotificationRepository();
    const preferenceRepo = new PreferenceRepository();
    const deviceRepo = new DeviceRepository();
    const deliveryRepo = new DeliveryRepository();

    this.instances.set('notificationRepository', notificationRepo);
    this.instances.set('preferenceRepository', preferenceRepo);
    this.instances.set('deviceRepository', deviceRepo);
    this.instances.set('deliveryRepository', deliveryRepo);

    const fcmAdapter = new FcmAdapter(env, logger);
    const resendAdapter = new ResendAdapter(env, logger);
    const twilioAdapter = new TwilioAdapter(env, logger);
    const msg91Adapter = new Msg91Adapter(env, logger);

    this.instances.set('fcmAdapter', fcmAdapter);
    this.instances.set('resendAdapter', resendAdapter);
    this.instances.set('twilioAdapter', twilioAdapter);
    this.instances.set('msg91Adapter', msg91Adapter);

    const pushChannel = new PushChannel(deviceRepo, fcmAdapter, logger);
    const emailChannel = new EmailChannel(resendAdapter, logger);
    const activeSmsAdapter = env.PRIMARY_SMS_PROVIDER === 'msg91' ? msg91Adapter : twilioAdapter;
    const smsChannel = new SmsChannel(activeSmsAdapter, logger);
    const inAppChannel = new InAppChannel(notificationRepo, logger);

    this.instances.set('pushChannel', pushChannel);
    this.instances.set('emailChannel', emailChannel);
    this.instances.set('smsChannel', smsChannel);
    this.instances.set('inAppChannel', inAppChannel);

    const templateEngine = new TemplateEngine(logger);
    this.instances.set('templateEngine', templateEngine);

    const dispatcherService = new DispatcherService(this);
    this.instances.set('dispatcherService', dispatcherService);

    const orchestratorService = new NotificationOrchestrator(
      redis,
      preferenceRepo,
      notificationRepo,
      templateEngine,
      dispatcherService,
      logger
    );
    this.instances.set('orchestratorService', orchestratorService);

    logger.info('Notification-service dependency graph ready.');
    return this;
  }

  resolve(key) {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Dependency resolve missing target token exception: ${key}`);
    }

    return instance;
  }
}

module.exports = new Container();
