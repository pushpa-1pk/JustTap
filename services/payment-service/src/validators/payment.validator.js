const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const paymentValidator = {
  // P0/P1 Absolute Hardening: Client passes ONLY the bookingId. No prices or user IDs are accepted.
  createOrder: Joi.object({
    bookingId: Joi.string().regex(objectIdRegex).required()
  }).options({ convert: false }), // P1: Strict type compliance enforcement

  verifyPayment: Joi.object({
    gatewayOrderId: Joi.string().min(5).max(100).trim().required(),
    gatewayPaymentId: Joi.string().min(5).max(100).trim().required(),
    gatewaySignature: Joi.string().min(10).max(256).trim().required()
  }).options({ convert: false }),

  executeRefund: Joi.object({
    bookingId: Joi.string().regex(objectIdRegex).required(),
    amountPaise: Joi.number().integer().positive().required(),
    reason: Joi.string().min(4).max(255).trim().required(),
    externalIdempotencyKey: Joi.string().min(10).max(128).trim().required()
  }).options({ convert: false }),

  initializeSettlement: Joi.object({
    paymentId: Joi.string().regex(objectIdRegex).required()
  }).options({ convert: false }),

  releaseSettlement: Joi.object({
    settlementId: Joi.string().regex(objectIdRegex).required()
  }).options({ convert: false }),

  requestWithdrawal: Joi.object({
    amountPaise: Joi.number().integer().positive().min(10000).required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().min(9).max(18).regex(/^\d+$/).required(),
      ifscCode: Joi.string().regex(ifscRegex).uppercase().required(),
      accountHolderName: Joi.string().min(2).max(100).trim().required()
    }).required()
  }).options({ convert: false })
};

module.exports = paymentValidator;
