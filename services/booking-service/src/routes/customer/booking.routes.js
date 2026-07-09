const express = require('express');
const router = express.Router();

const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const ownership = require('../../middlewares/ownership.middleware');

const { bookingIdSchema } = require('../../validators/booking.validator');

const BookingQueryController = require('../../controllers/customer/booking-query.controller');
const queryController = new BookingQueryController();

router.use(authenticate, authorize('CUSTOMER'));

// Registering clean query operations alongside command interfaces
router.get('/history', queryController.listHistory);
router.get('/:id', validate({ params: bookingIdSchema }), ownership, queryController.getDetails);
router.get('/:id/timeline', validate({ params: bookingIdSchema }), ownership, queryController.getTimeline);

module.exports = router;