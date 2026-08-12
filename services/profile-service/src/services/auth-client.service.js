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

  /**
   * Mirrors profile completion back to auth-service so `profileCompleted`
   * survives logout/login. Never throws: a saved profile must not fail
   * because auth-service is unreachable.
   */
  async updateProfileStatus(userId, profileCompleted) {
    if (!env.AUTH_SERVICE_URL) {
      return false;
    }

    try {
      await axios.patch(
        `${env.AUTH_SERVICE_URL}/api/v1/internal/users/${userId}/profile-status`,
        { profileCompleted },
        {
          headers: {
            "x-internal-api-key": env.INTERNAL_API_KEY,
          },
          timeout: env.AUTH_USER_LOOKUP_TIMEOUT_MS,
        }
      );

      return true;
    } catch (error) {
      logger.warn("AUTH_PROFILE_STATUS_SYNC_FAILED", {
        userId,
        profileCompleted,
        message: error.message,
      });

      return false;
    }
  }
}

module.exports = new AuthClientService();
