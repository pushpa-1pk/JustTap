const { redisClient } = require("../config/redis");
const keys = require("../constants/redisKeys");

class LocationRepository {
  constructor() {
    this.geoKey = keys.providerLocations;
  }

  async addLocation(providerId, longitude, latitude) {
    await redisClient.geoAdd(this.geoKey, {
      longitude: Number(longitude),
      latitude: Number(latitude),
      member: String(providerId),
    });
  }

  async getLocation(providerId) {
    const positions = await redisClient.geoPos(this.geoKey, String(providerId));
    if (!positions || !positions[0]) {
      return null;
    }

    return {
      longitude: Number(positions[0].longitude),
      latitude: Number(positions[0].latitude),
    };
  }

  async removeLocation(providerId) {
    await redisClient.zRem(this.geoKey, String(providerId));
    await redisClient.del(keys.providerLocationTimestamp(providerId));
  }
}

module.exports = LocationRepository;
