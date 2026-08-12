const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { generalRateLimiter } = require("../middlewares/rate-limit.middleware");
const { profileImageUpload } = require("../middlewares/upload.middleware");
const customerProfileController = require("../controllers/customer-profile.controller");

router.use(generalRateLimiter, verifyToken, verifyRole(["customer", "provider"]));
router.post("/", profileImageUpload, customerProfileController.createProfile);
router.get("/", customerProfileController.getProfile);
router.put("/", profileImageUpload, customerProfileController.updateProfile);
router.get("/with-addresses", customerProfileController.getProfileWithAddresses);
router.get("/referral", customerProfileController.getReferralInfo);

module.exports = router;
