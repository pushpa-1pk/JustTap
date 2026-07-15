const { RANKING_WEIGHTS } = require("../../constants/matching.constants");

class RankingService {
  constructor() {
    this.weights = RANKING_WEIGHTS;
  }

  async rankProviders(candidates) {
    if (!candidates?.length) return [];

    const bounds = this._calculateBatchBounds(candidates);

    return [...candidates]
      .map((candidate) => {
        const distanceScore =
          bounds.maxDistance === bounds.minDistance
            ? 1
            : 1 -
              (candidate.distance - bounds.minDistance) /
                (bounds.maxDistance - bounds.minDistance);

        const priceValue = candidate.pricing?.value || 0;
        const priceScore =
          bounds.maxPrice === bounds.minPrice
            ? 1
            : 1 - (priceValue - bounds.minPrice) / (bounds.maxPrice - bounds.minPrice);

        const ratingScore =
          bounds.maxRating === bounds.minRating
            ? 1
            : (candidate.metrics.rating - bounds.minRating) /
              (bounds.maxRating - bounds.minRating);

        const experienceScore =
          bounds.maxExp === bounds.minExp
            ? 1
            : (candidate.metrics.experienceYears - bounds.minExp) /
              (bounds.maxExp - bounds.minExp);

        const acceptanceScore =
          bounds.maxAcceptance === bounds.minAcceptance
            ? 1
            : (candidate.metrics.acceptanceRate - bounds.minAcceptance) /
              (bounds.maxAcceptance - bounds.minAcceptance);

        const etaScore = candidate.etaMinutes > 0 ? 1 / candidate.etaMinutes : 0;
        const finalScore =
          distanceScore * this.weights.DISTANCE +
          ratingScore * this.weights.RATING +
          etaScore * this.weights.ETA +
          priceScore * this.weights.PRICE +
          experienceScore * this.weights.EXPERIENCE +
          acceptanceScore * this.weights.ACCEPTANCE_RATE +
          this.weights.WORKLOAD;

        return {
          ...candidate,
          matchingScore: Math.round(finalScore * 1000) / 1000,
        };
      })
      .sort((left, right) => right.matchingScore - left.matchingScore);
  }

  _calculateBatchBounds(candidates) {
    return {
      minDistance: Math.min(...candidates.map((candidate) => candidate.distance)),
      maxDistance: Math.max(...candidates.map((candidate) => candidate.distance)),
      minPrice: Math.min(...candidates.map((candidate) => candidate.pricing?.value || 0)),
      maxPrice: Math.max(...candidates.map((candidate) => candidate.pricing?.value || 0)),
      minRating: Math.min(...candidates.map((candidate) => candidate.metrics.rating)),
      maxRating: Math.max(...candidates.map((candidate) => candidate.metrics.rating)),
      minExp: Math.min(
        ...candidates.map((candidate) => candidate.metrics.experienceYears)
      ),
      maxExp: Math.max(
        ...candidates.map((candidate) => candidate.metrics.experienceYears)
      ),
      minAcceptance: Math.min(
        ...candidates.map((candidate) => candidate.metrics.acceptanceRate)
      ),
      maxAcceptance: Math.max(
        ...candidates.map((candidate) => candidate.metrics.acceptanceRate)
      ),
    };
  }
}

module.exports = RankingService;
