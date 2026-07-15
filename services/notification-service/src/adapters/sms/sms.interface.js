class SmsAdapterInterface {
  async sendSms(to, body) {
    throw new Error('sendSms method signature alignment mandatory.');
  }
}
module.exports = SmsAdapterInterface;