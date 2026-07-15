const BaseChannel = require('../base.channel');

class SmsChannel extends BaseChannel {
  constructor(smsAdapter, logger) {
    super();
    this.smsAdapter = smsAdapter;
    this.logger = logger;
  }

  async validate(jobPayload) {
    const targetPhone = jobPayload.metadata?.phone || jobPayload.metadata?.get('phone');
    if (!targetPhone) {
      throw new Error('SMS_TRANSMISSION_DENIED_MISSING_PHONE_NUMBER');
    }
    jobPayload.resolvedPhone = targetPhone;
    return true;
  }

  async send(jobPayload) {
    const res = await this.smsAdapter.sendSms(jobPayload.resolvedPhone, jobPayload.body);
    return { success: true, provider: 'SMS_GATEWAY', providerMessageId: res.messageId };
  }
}

module.exports = SmsChannel;