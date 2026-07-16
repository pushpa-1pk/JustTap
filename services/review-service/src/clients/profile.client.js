const axios = require("axios");
const config = require("../config/env");
const logger = require("../config/logger");

class ProfileClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.services.profileServiceUrl,
      timeout: config.services.internalRequestTimeoutMs,
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.security.internalApiKey,
      },
    });
  }

  async syncProviderRating(providerId, summary) {
    try {
      await this.client.patch(`/api/v1/internal/providers/${providerId}/rating`, {
        averageRating: Number(summary?.averageRating || 0),
        totalReviews: Number(summary?.totalReviews || 0),
        ratingBreakdown: summary?.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    } catch (error) {
      logger.error("Failed to sync provider rating with profile-service.", {
        providerId,
        message: error.message,
        status: error.response?.status,
      });
    }
  }
}

module.exports = new ProfileClient();
