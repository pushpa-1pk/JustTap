const reviewService = require('../service/review.service');
const reviewRepository = require('../repositories/review.repository');
const ratingRepository = require('../repositories/rating.repository');
const { validateCreateReview, validateUpdateReview } = require('../validators/review.validator');
const ApiError = require('../utils/apiError');

exports.createReview = async (req, res, next) => {
  try {
    const customerId = req.user.id; 
    const { error, value } = validateCreateReview(req.body);
    if (error) {
      throw new ApiError(400, error.details.map((detail) => detail.message).join(', '));
    }

    const result = await reviewService.submitNewCustomerReview(customerId, value);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { error, value } = validateUpdateReview(req.body);
    if (error) {
      throw new ApiError(400, error.details.map((detail) => detail.message).join(', '));
    }

    const result = await reviewService.modifyExistingReview(customerId, req.params.id, value);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    await reviewService.deleteReviewRecord(customerId, req.params.id);
    return res.status(200).json({ success: true, message: 'Review successfully removed.' });
  } catch (error) {
    next(error);
  }
};

exports.getProviderReviewsList = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filterOptions = {};
    if (req.query.rating) filterOptions.rating = parseInt(req.query.rating);

    const data = await reviewRepository.getPaginatedReviewsByProvider(providerId, filterOptions, page, limit);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

exports.getProviderSummaryScores = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    let summary = await ratingRepository.findOne({ providerId });
    
    if (!summary) {
      summary = {
        providerId,
        averageRating: 0.0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerReviewsHistory = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const data = await reviewRepository.getPaginatedReviewsByCustomer(customerId, page, limit);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
