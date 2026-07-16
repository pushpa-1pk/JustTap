const reviewRepository = require('../repositories/review.repository');
const ratingRepository = require('../repositories/rating.repository');
const eligibilityService = require('./eligibility.service');
const reviewPublisher = require('../events/publishers/review.publisher');
const profileClient = require('../clients/profile.client');
const ApiError = require('../utils/apiError');

class ReviewService {
  async submitNewCustomerReview(customerId, payload) {
    const { bookingId, providerId, serviceId, rating, title, comment, images, tags } = payload;

    // 1. Run eligibility verification rules
    await eligibilityService.verifySubmissionEligibility(customerId, bookingId, providerId, serviceId);

    // 2. Persist the Review record using the repository layer
    const savedReview = await reviewRepository.create({
      bookingId,
      customerId,
      providerId,
      serviceId,
      rating,
      title,
      comment,
      images,
      tags
    });

    // 3. Atomically update the aggregate stats map in O(1) complexity
    const updatedSummary = await ratingRepository.applyIncrementalDelta(providerId, rating);

    // 4. Emit event frames to the notification and matching brokers
    await reviewPublisher.publishReviewCreated(savedReview);
    if (updatedSummary) {
      await reviewPublisher.publishRatingUpdated(providerId, updatedSummary);
      await profileClient.syncProviderRating(providerId, updatedSummary);
    }

    return savedReview;
  }

  async modifyExistingReview(customerId, reviewId, updatePayload) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new ApiError(404, 'Review target row entry not found.');
    if (String(review.customerId) !== String(customerId)) throw new ApiError(403, 'Action access rejected.');

    const oldRating = review.rating;
    const newRating = updatePayload.rating ? parseInt(updatePayload.rating) : oldRating;

    review.title = updatePayload.title !== undefined ? updatePayload.title : review.title;
    review.comment = updatePayload.comment !== undefined ? updatePayload.comment : review.comment;
    review.images = updatePayload.images !== undefined ? updatePayload.images : review.images;
    review.tags = updatePayload.tags !== undefined ? updatePayload.tags : review.tags;
    
    if (updatePayload.rating) {
      review.rating = newRating;
    }
    
    review.edited = true;
    review.editedAt = new Date();
    await review.save();

    let updatedSummary = null;
    if (oldRating !== newRating) {
      updatedSummary = await ratingRepository.applyIncrementalDelta(review.providerId, newRating, oldRating);
    }

    await reviewPublisher.publishReviewUpdated(review);
    if (updatedSummary) {
      await reviewPublisher.publishRatingUpdated(review.providerId, updatedSummary);
      await profileClient.syncProviderRating(review.providerId, updatedSummary);
    }

    return review;
  }

  async deleteReviewRecord(customerId, reviewId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new ApiError(404, 'Review target row entry not found.');
    if (String(review.customerId) !== String(customerId)) throw new ApiError(403, 'Action access rejected.');

    const targetedRating = review.rating;
    const providerId = review.providerId;

    await review.deleteOne();
    const updatedSummary = await ratingRepository.applyNegativeDelta(providerId, targetedRating);

    await reviewPublisher.publishReviewDeleted(reviewId, providerId);
    if (updatedSummary) {
      await reviewPublisher.publishRatingUpdated(providerId, updatedSummary);
      await profileClient.syncProviderRating(providerId, updatedSummary);
    }

    return { success: true };
  }
}

module.exports = new ReviewService();
