const BaseRepository = require("./base.repository");
const Session = require("../models/Session");

class SessionRepository extends BaseRepository {
  constructor() {
    super(Session);
  }

  async findByUser(userId) {
    return this.find({ userId });
  }

  async findByDevice(deviceId) {
    return this.findOne({ deviceId });
  }

  async findByUserAndDevice(userId, deviceId) {
    return this.findOne({
      userId,
      deviceId,
    });
  }

  async updateLastSeen(deviceId) {
    return this.model.findOneAndUpdate(
      { deviceId },
      {
        lastSeen: new Date(),
        isOnline: true,
      },
      {
        new: true,
      }
    );
  }

  async markOffline(deviceId) {
    return this.model.findOneAndUpdate(
      { deviceId },
      {
        isOnline: false,
      },
      {
        new: true,
      }
    );
  }

  async deleteByDevice(deviceId) {
    return this.model.deleteOne({
      deviceId,
    });
  }

  async deleteByUserAndDevice(userId, deviceId) {
    return this.model.deleteOne({
      userId,
      deviceId,
    });
  }

  async deleteAllByUser(userId) {
    return this.model.deleteMany({
      userId,
    });
  }

  async upsertSession(userId, sessionData) {
    return this.model.findOneAndUpdate(
      {
        userId,
        deviceId: sessionData.deviceId,
      },
      {
        $set: {
          ...sessionData,
          userId,
          isOnline: true,
          lastSeen: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }
}

module.exports = new SessionRepository();
