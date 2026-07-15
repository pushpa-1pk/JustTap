const express = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const requireInternalApiKey = require('../middlewares/internal-auth.middleware');
const InternalController = require('../controllers/internal.controller');

const router = express.Router();
const controller = new InternalController();

const bookingIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const startMatchingSchema = Joi.object({
  providerId: Joi.string().hex().length(24).required(),
  providerSnapshot: Joi.object({
    businessName: Joi.string().allow(null, '').optional(),
    phone: Joi.string().allow(null, '').optional()
  }).optional(),
  expectedStatuses: Joi.array().items(Joi.string()).optional()
});

const acceptMatchingSchema = Joi.object({
  providerId: Joi.string().hex().length(24).required()
});

const rejectMatchingSchema = Joi.object({
  reason: Joi.string().trim().optional(),
  fallbackCandidateProvider: Joi.object({
    providerId: Joi.string().hex().length(24).required(),
    businessName: Joi.string().allow(null, '').optional(),
    phone: Joi.string().allow(null, '').optional()
  }).allow(null).optional()
});

const verifyTrackingSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid('CUSTOMER', 'PROVIDER', 'ADMIN').required()
});

router.use(requireInternalApiKey);

router.get('/:id', validate({ params: bookingIdSchema }), controller.getBooking);
router.patch(
  '/:id/matching/request',
  validate({ params: bookingIdSchema, body: startMatchingSchema }),
  controller.startMatchingRequest
);
router.patch(
  '/:id/matching/accept',
  validate({ params: bookingIdSchema, body: acceptMatchingSchema }),
  controller.acceptMatchingRequest
);
router.patch(
  '/:id/matching/reject',
  validate({ params: bookingIdSchema, body: rejectMatchingSchema }),
  controller.rejectMatchingRequest
);
router.post(
  '/:id/verify-tracking',
  validate({ params: bookingIdSchema, body: verifyTrackingSchema }),
  controller.verifyTrackingAccess
);

module.exports = router;
