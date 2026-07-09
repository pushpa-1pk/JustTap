const express = require('express');
const router = express.Router();
const BookingCustomerController = require('../controllers/customer/booking.customer.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { createBookingSchema } = require('../validators/booking.validator');

const controller = new BookingCustomerController();

// Complete Request Ingress Execution Flow Map: Token Verification -> Tenant Check -> Input Validation -> Action
router.post('/', authenticate, authorize('CUSTOMER'), validate({ body: createBookingSchema }), controller.create);

module.exports = router;