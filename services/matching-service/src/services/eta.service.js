const { ESTIMATION_DEFAULTS } = require("../constants/matching.constants");

class EtaService {
  constructor() {
    this.averageSpeedKmh = ESTIMATION_DEFAULTS.AVERAGE_SPEED_KMH;
    this.trafficMultiplier = ESTIMATION_DEFAULTS.TRAFFIC_MULTIPLIER_BASE;
    this.prepBufferMins = ESTIMATION_DEFAULTS.BASE_PREPARATION_BUFFER_MINS;
  }

  estimateEtaMinutes(distanceKm) {
    if (!distanceKm || distanceKm <= 0) {
      return this.prepBufferMins;
    }

    const travelMinutes = (distanceKm / this.averageSpeedKmh) * 60;
    return Math.ceil(travelMinutes * this.trafficMultiplier + this.prepBufferMins);
  }
}

module.exports = EtaService;
