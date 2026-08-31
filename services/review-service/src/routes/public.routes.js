const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const validate = require('../middlewares/validate.middleware');
const { providerIdParamSchema } = require('../validators/review.validator');

router.get('/provider/:providerId', validate(providerIdParamSchema, 'params'), reviewController.getProviderReviewsList);
router.get('/summary/provider/:providerId', validate(providerIdParamSchema, 'params'), reviewController.getProviderSummaryScores);

module.exports = router;