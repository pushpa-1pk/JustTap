const reviewRepository = require('../repositories/review.repository');
const ratingRepository = require('../repositories/rating.repository');
const reviewPublisher = require('../events/publishers/review.publisher');
const profileClient = require('../clients/profile.client');
const ReviewReport = require('../models/reviewReport.model');
const { ReviewStatus, ReportStatus } = require('../constants/review.constants');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

class ModerationService {
  /**
   * Files a structural abuse report from a user against an active review payload text.
   */
  async reportReviewRecord(customerId, reviewId, reason) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Targeted review record not found.');
    }

    const reportingLog = await ReviewReport.create({
      reviewId,
      reportedBy: customerId,
      reason,
      status: ReportStatus.SUBMITTED
    });

    logger.info(`Abuse report entry [${reportingLog._id}] created for review [${reviewId}] by user [${customerId}]`);
    return reportingLog;
  }

  /**
   * Updates a review's moderation state and handles corresponding aggregate changes.
   */
  async updateReviewStatusByAdmin(reviewId, targetStatus, adminRemark) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Targeted review row not found.');
    }

    const previousStatus = review.status;
    if (previousStatus === targetStatus) {
      return review;
    }

    // Persist the state update
    review.status = targetStatus;
    await review.save();

    logger.info(`Review [${reviewId}] status altered by admin from [${previousStatus}] to [${targetStatus}]`);

    let updatedSummary = null;

    // Mathematical Adjustments: If a review moves from APPROVED to a hidden state, subtract its score.
    if (previousStatus === ReviewStatus.APPROVED && targetStatus !== ReviewStatus.APPROVED) {
      updatedSummary = await ratingRepository.applyNegativeDelta(review.providerId, review.rating);
    } 
    // If a hidden review is restored to APPROVED, add its score back using the O(1) incremental engine.
    else if (previousStatus !== ReviewStatus.APPROVED && targetStatus === ReviewStatus.APPROVED) {
      updatedSummary = await ratingRepository.applyIncrementalDelta(review.providerId, review.rating);
    }

    // Broadcast the changes across the ecosystem
    if (targetStatus === ReviewStatus.HIDDEN || targetStatus === ReviewStatus.REJECTED) {
      await reviewPublisher.publishReviewDeleted(reviewId, review.providerId);
    } else if (targetStatus === ReviewStatus.APPROVED) {
      await reviewPublisher.publishReviewCreated(review);
    }

    if (updatedSummary) {
      await reviewPublisher.publishRatingUpdated(review.providerId, updatedSummary);
      await profileClient.syncProviderRating(review.providerId, updatedSummary);
    }

    // Resolve associated report tickets automatically if hidden/rejected
    if (targetStatus === ReviewStatus.HIDDEN || targetStatus === ReviewStatus.REJECTED) {
      await ReviewReport.updateMany(
        { reviewId, status: ReportStatus.SUBMITTED },
        { $set: { status: ReportStatus.REVIEW_HIDDEN, adminRemark } }
      );
    }

    return review;
  }

  /**
   * Fetches pending abuse queues for administrative triage workflows.
   */
  async getActiveAbuseReportsQueue(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const docs = await ReviewReport.find({ status: ReportStatus.SUBMITTED })
      .populate('reviewId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReviewReport.countDocuments({ status: ReportStatus.SUBMITTED });
    return { docs, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new ModerationService();
