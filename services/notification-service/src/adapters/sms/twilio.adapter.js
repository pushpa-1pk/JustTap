const SmsAdapterInterface = require('./sms.interface');
const twilio = require('twilio');

class TwilioAdapter extends SmsAdapterInterface {
  constructor(env, logger) {
    super();
    this.logger = logger;
    this.env = env;
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendSms(to, body) {
    if (!this.client) {
      this.logger.warn(`Twilio configs uninitialized. Simulating live loop connection parameters to ${to}`);
      return { messageId: `mock_twilio_ref_${Date.now()}` };
    }

    const res = await this.client.messages.create({
      body,
      from: this.env.TWILIO_PHONE_NUMBER,
      to
    });
    return { messageId: res.sid };
  }
}

module.exports = TwilioAdapter;