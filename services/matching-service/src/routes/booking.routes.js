const express = require("express");
const requestController = require("../controllers/bookingRequest.controller");
const {
  createRequestInvitationSchema,
  resolveRequestSchema,
} = require("../validators/bookingRequest.validator");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const authorizeRole = (targetRole) => (req, res, next) => {
  if (req.user?.role === targetRole) {
    return next();
  }

  return next(new ApiError(`Role ${targetRole} is required.`, 403));
};

router.post(
  "/booking-requests",
  authenticate,
  authorizeRole("CUSTOMER"),
  validate(createRequestInvitationSchema),
  requestController.dispatchRequest
);

router.post(
  "/booking-requests/:id/accept",
  authenticate,
  authorizeRole("PROVIDER"),
  validate(resolveRequestSchema),
  requestController.acceptRequest
);

router.post(
  "/booking-requests/:id/reject",
  authenticate,
  authorizeRole("PROVIDER"),
  validate(resolveRequestSchema),
  requestController.rejectRequest
);

module.exports = router;
