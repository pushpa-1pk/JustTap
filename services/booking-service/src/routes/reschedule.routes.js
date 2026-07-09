const express = require('express');
const router = express.Router();

const RescheduleController = require('../controllers/customer/reschedule.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ownership = require('../middlewares/ownership.middleware');
const { bookingIdSchema } = require('../validators/booking.validator');
const { reschedulePayloadSchema } = require('../validators/reschedule.validator');

const controller = new RescheduleController();

router.post(
  '/:id/reschedule',
  authenticate,
  authorize('CUSTOMER', 'PROVIDER', 'ADMIN'),
  validate({ params: bookingIdSchema, body: reschedulePayloadSchema }),
  ownership,
  controller.reschedule
);

module.exports = router;
