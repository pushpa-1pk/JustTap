const express = require('express');
const router = express.Router();
const BookingProviderController = require('../controllers/provider/booking.provider.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ownership = require('../middlewares/ownership.middleware');
const { bookingIdSchema, advanceStatusSchema, verifyHandshakeSchema } = require('../validators/booking.validator');

const controller = new BookingProviderController();

router.use(authenticate, authorize('PROVIDER'));

// Secure Gated Endpoint Subtrees
router.patch('/:id/accept', validate({ params: bookingIdSchema }), ownership, controller.accept);
router.patch('/:id/advance', validate({ params: bookingIdSchema, body: advanceStatusSchema }), ownership, controller.advance);
router.post('/:id/verify-handshake', validate({ params: bookingIdSchema, body: verifyHandshakeSchema }), ownership, controller.verifyHandshake);

module.exports = router;