const BaseRepository = require('./base.repository');
const Review = require('../models/review.model');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async getPaginatedReviewsByProvider(providerId, filterOptions, page, limit) {
    const query = { providerId, status: 'APPROVED', ...filterOptions };
    const skip = (page - 1) * limit;

    const docs = await this.model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.model.countDocuments(query);

    return { docs, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new ReviewRepository();