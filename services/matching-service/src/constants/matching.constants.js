const RANKING_WEIGHTS = Object.freeze({
  DISTANCE: 0.30,
  RATING: 0.20,
  ETA: 0.15,
  PRICE: 0.15,
  EXPERIENCE: 0.10,
  ACCEPTANCE_RATE: 0.05,
  WORKLOAD: 0.05
});

const ESTIMATION_DEFAULTS = Object.freeze({
  AVERAGE_SPEED_KMH: 25, // Optimized for urban motorcycle/scooter dispatch speeds
  TRAFFIC_MULTIPLIER_BASE: 1.25,
  BASE_PREPARATION_BUFFER_MINS: 3
});

module.exports = {
  RANKING_WEIGHTS,
  ESTIMATION_DEFAULTS
};