const BaseChannel = require('../base.channel');

class PushChannel extends BaseChannel {
  constructor(deviceRepo, fcmAdapter, logger) {
    super();
    this.deviceRepo = deviceRepo;
    this.fcmAdapter = fcmAdapter;
    this.logger = logger;
  }

  async validate(jobPayload) {
    const devices = await this.deviceRepo.findActiveUserTokens(jobPayload.userId);
    if (!devices || devices.length === 0) {
      this.logger.info(`Suppressed Push channel dispatch for ${jobPayload.userId}: No active tokens found.`);
      return false;
    }
    jobPayload.resolvedTokens = devices.map(d => d.fcmToken);
    return true;
  }

  async send(jobPayload) {
    const { title, body, metadata, resolvedTokens } = jobPayload;
    const payload = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
    
    const response = await this.fcmAdapter.sendMulticastPush(resolvedTokens, title, body, payload);
    
    // Auto token validation pruning logic handler block integrations
    if (response.failureCount > 0) {
      response.responses.forEach(async (res, idx) => {
        if (!res.success && res.error && (res.error.code === 'messaging/registration-token-not-registered')) {
          await this.deviceRepo.updateOne({ fcmToken: resolvedTokens[idx] }, { $set: { isActive: false } });
        }
      });
    }

    return { success: true, provider: 'FIREBASE_FCM', providerMessageId: 'multicast_complete' };
  }
}

module.exports = PushChannel;