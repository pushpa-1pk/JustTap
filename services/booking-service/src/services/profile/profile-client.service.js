const BaseHttpService = require('../http/base-http.service');
const env = require('../../config/env');

class ProfileClientService extends BaseHttpService {
  async getCustomerProfile(accessToken) {
    if (!env.profileServiceUrl) {
      return null;
    }

    return this.getJson(`${env.profileServiceUrl}/api/v1/profiles/customer`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeoutMs: env.profileLookupTimeoutMs
    });
  }

  async getProviderProfileByUserId(userId, accessToken) {
    if (!env.profileServiceUrl || !userId) {
      return null;
    }

    return this.getJson(`${env.profileServiceUrl}/api/v1/internal/providers/${userId}`, {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`
          }
        : {},
      timeoutMs: env.profileLookupTimeoutMs
    });
  }
}

module.exports = new ProfileClientService();
