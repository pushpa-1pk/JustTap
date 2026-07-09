const axios = require("axios");
const env = require("../config/env");
const logger = require("./logger.service");
const ApiError = require("../utils/ApiError");

class AuthClientService {
  async getCurrentUser(accessToken) {
    if (!env.AUTH_SERVICE_URL) {
      if (env.AUTH_USER_LOOKUP_REQUIRED) {
        throw new ApiError(503, "Auth service URL is not configured.");
      }

      return null;
    }

    try {
      const response = await axios.get(`${env.AUTH_SERVICE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: env.AUTH_USER_LOOKUP_TIMEOUT_MS,
      });

      return response.data?.data || null;
    } catch (error) {
      logger.warn("AUTH_SERVICE_LOOKUP_FAILED", {
        message: error.message,
      });

      if (env.AUTH_USER_LOOKUP_REQUIRED) {
        throw new ApiError(503, "Unable to validate authenticated user.");
      }

      return null;
    }
  }
}

module.exports = new AuthClientService();
