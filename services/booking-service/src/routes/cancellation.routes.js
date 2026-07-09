const express = require('express');
const router = express.Router();
const CancellationController = require('../controllers/customer/cancellation.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ownership = require('../middlewares/ownership.middleware');
const { bookingIdSchema } = require('../validators/booking.validator');
const { cancellationPayloadSchema } = require('../validators/cancellation.validator');

const controller = new CancellationController();

router.post(
  '/:id/cancel',
  authenticate,
  authorize('CUSTOMER', 'PROVIDER', 'ADMIN'),
  validate({ params: bookingIdSchema, body: cancellationPayloadSchema }),
  ownership,
  controller.cancel
);

module.exports = router;
