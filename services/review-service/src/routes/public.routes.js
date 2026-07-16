const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

router.get('/provider/:providerId', reviewController.getProviderReviewsList);
router.get('/summary/provider/:providerId', reviewController.getProviderSummaryScores);

module.exports = router;