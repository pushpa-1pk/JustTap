const express = require('express');
const router = express.Router();
const BookingCustomerController = require('../controllers/customer/booking.customer.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { createBookingSchema } = require('../validators/booking.validator');

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const bookingCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per 15 min per User
  keyGenerator: (req) => String(req.user?.id || req.user?.userId || ipKeyGenerator(req.ip)),
  message: { success: false, message: 'Too many booking creation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const controller = new BookingCustomerController();

// Complete Request Ingress Execution Flow Map: Token Verification -> Tenant Check -> Rate Limit -> Input Validation -> Action
router.post('/', authenticate, authorize('CUSTOMER'), bookingCreationLimiter, validate({ body: createBookingSchema }), controller.create);

module.exports = router;