const ratingRepository = require('../../repositories/rating.repository');
const logger = require('../../config/logger');

class BookingHandler {
  /**
   * Processes the 'booking.completed' event to safely initialize tracking summaries.
   */
  async handleBookingCompleted(eventData) {
    const { providerId, bookingId, customerId } = eventData;

    if (!providerId) {
      logger.error('Malformed transaction block received. Missing valid "providerId":', eventData);
      return;
    }

    logger.info(`Processing completion routine for provider record: [${providerId}], booking: [${bookingId}]`);

    try {
      // Safely find or initialize the rating document using atomic operations
      const targetSummary = await ratingRepository.findOne({ providerId });

      if (!targetSummary) {
        logger.info(`No summary records found for provider [${providerId}]. Initializing structural caching row...`);
        
        await ratingRepository.create({
          providerId,
          averageRating: 0.0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          lastReviewAt: null
        }).catch((duplicateErr) => {
          // Handle potential race conditions where another thread initialized the record simultaneously
          if (duplicateErr.code === 11000) {
            logger.warn(`Concurrently created mapping detected for provider ID [${providerId}]. Gracefully absorbing duplicate key exception.`);
          } else {
            throw duplicateErr;
          }
        });
      }

      logger.info(`Idempotent completion pipeline verified for booking context row transaction: [${bookingId}]`);
    } catch (dbOperationException) {
      logger.error(`Failed to execute idempotent tracking summary update for provider [${providerId}]:`, dbOperationException);
      throw dbOperationException; // Propagate the error up to trigger a nack/requeue strategy
    }
  }
}

module.exports = new BookingHandler();