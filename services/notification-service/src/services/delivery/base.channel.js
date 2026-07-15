class BaseChannel {
  async send(jobPayload) {
    throw new Error('send() implementation is required.');
  }
  async validate(jobPayload) {
    return true; // Base rule defaults to allow processing
  }
}
module.exports = BaseChannel;