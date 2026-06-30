const BaseRepository = require("./base.repository");
const RefreshToken = require("../models/RefreshToken");

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async findByJti(jti) {
    return this.findOne({ jti });
  }

  async findByUser(userId) {
    return this.find({ userId });
  }

  async findByUserAndDevice(userId, deviceId) {
    return this.findOne({
      userId,
      deviceId,
      revokedAt: null,
    });
  }

  async findActiveByFamilyId(userId, familyId) {
    return this.find({
      userId,
      familyId,
      revokedAt: null,
    });
  }

  async revokeByJti(jti, update = {}) {
    return this.model.findOneAndUpdate(
      { jti },
      {
        $set: {
          revokedAt: new Date(),
          ...update,
        },
      },
      {
        new: true,
      }
    );
  }

  async revokeByDevice(userId, deviceId, update = {}) {
    return this.model.updateMany(
      {
        userId,
        deviceId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          ...update,
        },
      }
    );
  }

  async revokeAllUserTokens(userId, update = {}) {
    return this.model.updateMany(
      {
        userId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          ...update,
        },
      }
    );
  }

  async revokeFamily(userId, familyId, update = {}) {
    return this.model.updateMany(
      {
        userId,
        familyId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          ...update,
        },
      }
    );
  }

  async touchLastUsed(jti) {
    return this.model.findOneAndUpdate(
      { jti },
      {
        $set: {
          lastUsedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );
  }

  async deleteAllUserTokens(userId) {
    return this.model.deleteMany({
      userId,
    });
  }

  async deleteExpiredTokens() {
    return this.model.deleteMany({
      expiresAt: {
        $lt: new Date(),
      },
    });
  }
}

module.exports = new RefreshTokenRepository();
