const rabbitmqConfig = require('../../config/rabbitmq');
const config = require('../../config/env');
const logger = require('../../config/logger');

class ReviewPublisher {
  async publishEvent(routingKey, payload) {
    try {
      const channel = rabbitmqConfig.getChannel();
      const exchangeName = config.rabbitmq.exchanges.events;
      const userId = payload?.userId || payload?.providerId || null;
      const bufferPayload = Buffer.from(JSON.stringify({
        eventId: `${Date.now()}_${Math.random().toString(36).substring(2, 12)}`,
        userId: userId ? String(userId) : null,
        timestamp: new Date().toISOString(),
        payload
      }));

      channel.publish(exchangeName, routingKey, bufferPayload, { persistent: true });
      logger.info(`Successfully emitted outbox log packet via route: [${routingKey}]`);
    } catch (error) {
      logger.error(`Critical outbox emitter failure on route [${routingKey}]:`, error);
    }
  }

  async publishReviewCreated(review) {
    return this.publishEvent(config.rabbitmq.routingKeys.reviewCreated, {
      reviewId: String(review._id),
      bookingId: String(review.bookingId),
      customerId: String(review.customerId),
      providerId: String(review.providerId),
      serviceId: String(review.serviceId),
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      images: review.images || [],
      tags: review.tags || [],
      status: review.status,
      createdAt: review.createdAt
    });
  }

  async publishReviewUpdated(review) {
    return this.publishEvent(config.rabbitmq.routingKeys.reviewUpdated, {
      reviewId: String(review._id),
      bookingId: String(review.bookingId),
      customerId: String(review.customerId),
      providerId: String(review.providerId),
      serviceId: String(review.serviceId),
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      images: review.images || [],
      tags: review.tags || [],
      status: review.status,
      edited: Boolean(review.edited),
      editedAt: review.editedAt || null
    });
  }

  async publishReviewDeleted(reviewId, providerId) {
    return this.publishEvent(config.rabbitmq.routingKeys.reviewDeleted, { reviewId, providerId });
  }

  async publishRatingUpdated(providerId, aggregateSummary) {
    return this.publishEvent(config.rabbitmq.routingKeys.ratingUpdated, {
      providerId,
      averageRating: aggregateSummary.averageRating,
      totalReviews: aggregateSummary.totalReviews,
      ratingBreakdown: aggregateSummary.ratingBreakdown
    });
  }
}

module.exports = new ReviewPublisher();
