const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  sendOtpRateLimiter,
  verifyOtpRateLimiter,
  refreshTokenRateLimiter,
} = require("../middlewares/rateLimit.middleware");
const {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/send-otp",
  sendOtpRateLimiter,
  validate(sendOtpSchema),
  authController.sendOtp
);

router.post(
  "/verify-otp",
  verifyOtpRateLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  "/refresh-token",
  refreshTokenRateLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken
);

router.get("/me", authenticate, authController.getMe);

router.post(
  "/logout",
  authenticate,
  validate(logoutSchema),
  authController.logout
);

router.post("/logout-all", authenticate, authController.logoutAll);

router.post("/delete-account", authenticate, authController.deleteAccount);

router.post("/become-provider", authenticate, authController.becomeProvider);

router.post("/switch-role", authenticate, authController.switchRole);

module.exports = router;
