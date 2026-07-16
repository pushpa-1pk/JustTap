const BaseRepository = require('./base.repository');
const ProviderRating = require('../models/providerRating.model');

class RatingRepository extends BaseRepository {
  constructor() {
    super(ProviderRating);
  }

  /**
   * Executes O(1) mathematical algebraic delta modifier on active distribution balances.
   */
  async applyIncrementalDelta(providerId, targetRating, oldRating = null) {
    const updateQuery = {
      $inc: {
        totalReviews: oldRating ? 0 : 1,
        [`ratingBreakdown.${targetRating}`]: 1
      },
      $set: { lastReviewAt: new Date() }
    };

    if (oldRating) {
      updateQuery.$inc[`ratingBreakdown.${oldRating}`] = -1;
    }

    // Phase 1: Native Increment or Initialize record configuration map
    let record = await this.model.findOneAndUpdate(
      { providerId },
      updateQuery,
      { new: true, upsert: true }
    );

    // Phase 2: Derive true incremental algebraic mathematical average safely in memory
    const breakdown = record.ratingBreakdown;
    let computedSum = 0;
    let computedCount = 0;

    for (let stars = 1; stars <= 5; stars++) {
      const freq = breakdown[stars] || 0;
      computedSum += stars * freq;
      computedCount += freq;
    }

    const calculatedAvg = computedCount > 0 ? parseFloat((computedSum / computedCount).toFixed(2)) : 0.0;

    // Phase 3: Update finalized calculated average score
    return this.model.findOneAndUpdate(
      { providerId },
      { $set: { averageRating: calculatedAvg } },
      { new: true }
    );
  }

  async applyNegativeDelta(providerId, deletedRating) {
    const record = await this.model.findOne({ providerId });
    if (!record || record.totalReviews <= 0) return null;

    const currentBreakdownCount = record.ratingBreakdown[deletedRating] || 0;
    const updateQuery = {
      $inc: {
        totalReviews: -1,
        [`ratingBreakdown.${deletedRating}`]: currentBreakdownCount > 0 ? -1 : 0
      }
    };

    let updatedRecord = await this.model.findOneAndUpdate({ providerId }, updateQuery, { new: true });

    const breakdown = updatedRecord.ratingBreakdown;
    let computedSum = 0;
    let computedCount = 0;

    for (let stars = 1; stars <= 5; stars++) {
      const freq = breakdown[stars] || 0;
      computedSum += stars * freq;
      computedCount += freq;
    }

    const calculatedAvg = computedCount > 0 ? parseFloat((computedSum / computedCount).toFixed(2)) : 0.0;

    return this.model.findOneAndUpdate(
      { providerId },
      { $set: { averageRating: calculatedAvg } },
      { new: true }
    );
  }
}

module.exports = new RatingRepository();