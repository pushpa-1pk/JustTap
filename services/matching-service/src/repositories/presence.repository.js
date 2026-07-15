const { redisClient } = require("../config/redis");
const env = require("../config/env");
const keys = require("../constants/redisKeys");

class PresenceRepository {
  async savePresence(providerId, presence, ttlSeconds = env.PRESENCE_TTL_SECONDS) {
    await redisClient.set(
      keys.providerPresence(providerId),
      JSON.stringify(presence),
      { EX: ttlSeconds }
    );

    if (presence.locationUpdatedAt) {
      await redisClient.set(
        keys.providerLocationTimestamp(providerId),
        String(new Date(presence.locationUpdatedAt).getTime()),
        { EX: ttlSeconds }
      );
    }
  }

  async getPresence(providerId) {
    const raw = await redisClient.get(keys.providerPresence(providerId));
    return raw ? JSON.parse(raw) : null;
  }

  async getMultiplePresence(providerIds) {
    if (!Array.isArray(providerIds) || providerIds.length === 0) {
      return [];
    }

    const rawResults = await redisClient.mGet(
      providerIds.map((providerId) => keys.providerPresence(providerId))
    );

    return rawResults.map((row) => (row ? JSON.parse(row) : null));
  }

  async clearPresence(providerId) {
    await redisClient.del(keys.providerPresence(providerId));
    await redisClient.del(keys.providerLocationTimestamp(providerId));
  }
}

module.exports = PresenceRepository;
