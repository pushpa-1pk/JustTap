const sessionRepository = require("../repositories/session.repository");

class SessionService {
  async createOrUpdateSession(userId, sessionData) {
    return sessionRepository.upsertSession(userId, sessionData);
  }

  async getByUserAndDevice(userId, deviceId) {
    return sessionRepository.findByUserAndDevice(userId, deviceId);
  }

  async deleteByDevice(userId, deviceId) {
    return sessionRepository.deleteByUserAndDevice(userId, deviceId);
  }

  async deleteAllByUser(userId) {
    return sessionRepository.deleteAllByUser(userId);
  }

  async markOffline(deviceId) {
    return sessionRepository.markOffline(deviceId);
  }
}

module.exports = new SessionService();
