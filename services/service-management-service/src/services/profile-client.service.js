const axios = require("axios");
const env = require("../config/env");
const logger = require("./logger.service");

class ProfileClientService {
  async getProviderProfile(accessToken) {
    if (!env.PROFILE_SERVICE_URL) {
      return null;
    }

    try {
      const response = await axios.get(
        `${env.PROFILE_SERVICE_URL}/api/v1/profiles/provider`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: env.PROFILE_LOOKUP_TIMEOUT_MS,
        }
      );

      return response.data?.data || null;
    } catch (error) {
      logger.warn("PROFILE_SERVICE_LOOKUP_FAILED", {
        message: error.message,
      });

      return null;
    }
  }

  async getProviderProfilesByUserIds(userIds, accessToken) {
    if (!env.PROFILE_SERVICE_URL || !userIds.length) {
      return new Map();
    }

    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const profiles = new Map();

    await Promise.all(
      uniqueIds.map(async (userId) => {
        try {
          const response = await axios.get(
            `${env.PROFILE_SERVICE_URL}/api/v1/internal/providers/${userId}`,
            {
              headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
              timeout: env.PROFILE_LOOKUP_TIMEOUT_MS,
            }
          );

          const profile = response.data?.data;
          if (profile) {
            profiles.set(userId, profile);
          }
        } catch (error) {
          logger.debug("PROFILE_BATCH_LOOKUP_SKIPPED", {
            userId,
            message: error.message,
          });
        }
      })
    );

    return profiles;
  }
}

module.exports = new ProfileClientService();
