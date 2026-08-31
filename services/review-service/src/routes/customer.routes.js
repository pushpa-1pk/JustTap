const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { verifyRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { idParamSchema } = require('../validators/review.validator');

// Protect entire route tree
router.use(authMiddleware);
router.use(verifyRole(['customer']));

router.get('/history', reviewController.getCustomerReviewsHistory);
router.post('/', reviewController.createReview);
router.put('/:id', validate(idParamSchema, 'params'), reviewController.updateReview);
router.delete('/:id', validate(idParamSchema, 'params'), reviewController.deleteReview);

module.exports = router;
