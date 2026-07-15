const BaseRepository = require('./base.repository');
const DeviceToken = require('../models/deviceToken.model');

class DeviceRepository extends BaseRepository {
  constructor() {
    super(DeviceToken);
  }

  async registerDeviceToken(userId, data) {
    return this.model.findOneAndUpdate(
      { deviceId: data.deviceId, userId },
      { $set: { ...data, isActive: true, lastSeen: new Date() } },
      { upsert: true, new: true }
    ).exec();
  }

  async findActiveUserTokens(userId) {
    return this.model.find({ userId, isActive: true }).exec();
  }
}

module.exports = DeviceRepository;