const { redisClient } = require("../config/redis");
const keys = require("../constants/redisKeys");

class GeoRepository {
  constructor() {
    this.geoKey = keys.providerLocations;
  }

  /**
   * Performs a single spatial lookup and normalizes Redis primitives into domain structures.
   * @param {number} longitude - Geographic coordinate point.
   * @param {number} latitude - Geographic coordinate point.
   * @param {number} radiusKm - Spatial circular boundary limit.
   * @param {number} limit - Maximum candidate cutoff threshold.
   * @returns {Promise<Array<{providerId: string, distance: number, distanceUnit: string}>>}
   */
  async searchNearby(longitude, latitude, radiusKm, limit = 20) {
    const results = await redisClient.geoSearchWith(
      this.geoKey,
      { longitude: Number(longitude), latitude: Number(latitude) },
      { radius: Number(radiusKm), unit: "km" },
      ["WITHDIST"],
      { SORT: "ASC", COUNT: Number(limit) }
    );

    if (!results || results.length === 0) {
      return [];
    }

    return results.map((match) => ({
      providerId: match.member,
      distance: Number(match.distance),
      distanceUnit: "km"
    }));
  }
}

module.exports = GeoRepository;