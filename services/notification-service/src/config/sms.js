const env = require('./env');
const logger = require('./logger');

const smsConfig = {
  activeProvider: env.PRIMARY_SMS_PROVIDER,
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER
  },
  msg91: {
    authKey: env.MSG91_AUTH_KEY,
    senderId: env.MSG91_SENDER_ID,
    route: env.MSG91_ROUTE,
    country: env.MSG91_COUNTRY,
    dltTemplateId: env.MSG91_DLT_TEMPLATE_ID
  }
};

logger.info(`📩 Aggregator strategy initialized: Primary SMS gateway mapped to [${smsConfig.activeProvider.toUpperCase()}]`);

module.exports = Object.freeze(smsConfig);
