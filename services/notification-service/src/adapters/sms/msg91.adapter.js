const SmsAdapterInterface = require('./sms.interface');
const axios = require('axios');

class Msg91Adapter extends SmsAdapterInterface {
  constructor(env, logger) {
    super();
    this.env = env;
    this.logger = logger;
    this.client = axios.create({
      baseURL: 'https://control.msg91.com',
      timeout: 10000,
      headers: {
        authkey: env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendSms(to, body) {
    if (!this.env.MSG91_AUTH_KEY || !this.env.MSG91_SENDER_ID) {
      this.logger.warn(`MSG91 configs uninitialized. Simulating live loop connection parameters to ${to}`);
      return { messageId: `mock_msg91_ref_${Date.now()}` };
    }

    const mobile = this.normalizeIndianMobile(to);
    const payload = {
      mobiles: mobile,
      message: body,
      sender: this.env.MSG91_SENDER_ID,
      route: this.env.MSG91_ROUTE || '4',
      country: this.env.MSG91_COUNTRY || '91'
    };

    if (this.env.MSG91_DLT_TEMPLATE_ID) {
      payload.DLT_TE_ID = this.env.MSG91_DLT_TEMPLATE_ID;
    }

    const response = await this.client.post('/api/v2/sendsms', payload);
    return {
      messageId: response.data?.request_id || response.data?.message || `msg91_ref_${Date.now()}`
    };
  }

  normalizeIndianMobile(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 10) {
      return `${this.env.MSG91_COUNTRY || '91'}${digits}`;
    }

    return digits;
  }
}

module.exports = Msg91Adapter;
