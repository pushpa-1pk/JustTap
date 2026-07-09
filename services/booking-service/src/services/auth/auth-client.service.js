const BaseHttpService = require('../http/base-http.service');
const env = require('../../config/env');
const ApiError = require('../../utils/api.error');

class AuthClientService extends BaseHttpService {
  async getCurrentUser(accessToken) {
    if (!env.authServiceUrl) {
      if (env.authUserLookupRequired) {
        throw new ApiError('Auth service URL is not configured.', 503);
      }

      return null;
    }

    try {
      return await this.getJson(`${env.authServiceUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeoutMs: env.authUserLookupTimeoutMs
      });
    } catch (error) {
      if (env.authUserLookupRequired) {
        throw new ApiError('Unable to validate authenticated user.', 503);
      }

      return null;
    }
  }
}

module.exports = new AuthClientService();
