const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class ReviewCreatedHandler extends BaseHandler {
  constructor() {
    super('review.created');
  }

  extractMeta(payload) {
    const trimmedComment = String(payload.comment || '').trim();

    return {
      templateName: 'review.created',
      priority: PRIORITIES.NORMAL,
      channels: ['PUSH', 'IN_APP'],
      templateVars: {
        rating: payload.rating || 0,
        commentSuffix: trimmedComment ? `: "${trimmedComment}"` : '',
      },
      metadata: {
        reviewId: payload.reviewId || null,
        bookingId: payload.bookingId || null,
        rating: payload.rating || null,
      }
    };
  }

  getCategory() {
    return 'review';
  }
}

module.exports = ReviewCreatedHandler;
