const moderationService = require('../service/moderation.service');
const { validateReportReview } = require('../validators/review.validator');
const ApiError = require('../utils/apiError');

exports.submitAbuseReport = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { reviewId } = req.params;
    
    const { error, value } = validateReportReview(req.body);
    if (error) {
      throw new ApiError(400, `Input processing failure: ${error.details.map(d => d.message).join(', ')}`);
    }

    const report = await moderationService.reportReviewRecord(customerId, reviewId, value.reason);
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.getAbuseReportsQueue = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const reports = await moderationService.getActiveAbuseReportsQueue(page, limit);
    return res.status(200).json({ success: true, ...reports });
  } catch (error) {
    next(error);
  }
};

exports.moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status, adminRemark } = req.body;

    if (!status) {
      throw new ApiError(400, 'Target modification state parameters missing.');
    }

    const updatedReview = await moderationService.updateReviewStatusByAdmin(reviewId, status, adminRemark || '');
    return res.status(200).json({ 
      success: true, 
      message: 'Administrative state modulation updated.', 
      data: updatedReview 
    });
  } catch (error) {
    next(error);
  }
};
