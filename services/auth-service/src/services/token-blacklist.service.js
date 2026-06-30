const redisService = require("./redis.service");

const getBlacklistKey = (jti) => `jwt_blacklist:${jti}`;

class TokenBlacklistService {
  async blacklistToken(jti, expiresAtEpochSeconds) {
    if (!jti || !expiresAtEpochSeconds) {
      return;
    }

    const ttl = Math.max(
      1,
      expiresAtEpochSeconds - Math.floor(Date.now() / 1000)
    );

    await redisService.set(getBlacklistKey(jti), "1", ttl);
  }

  async isBlacklisted(jti) {
    if (!jti) {
      return false;
    }

    return redisService.exists(getBlacklistKey(jti));
  }
}

module.exports = new TokenBlacklistService();
