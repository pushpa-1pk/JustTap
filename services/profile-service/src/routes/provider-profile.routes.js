const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { providerRateLimiter } = require("../middlewares/rate-limit.middleware");
const { profileImageUpload } = require("../middlewares/upload.middleware");
const providerProfileController = require("../controllers/provider-profile.controller");

router.use(providerRateLimiter, verifyToken, verifyRole(["provider"]));
router.post("/", profileImageUpload, providerProfileController.createProfile);
router.get("/", providerProfileController.getProfile);
router.put("/", profileImageUpload, providerProfileController.updateProfile);
router.put("/location", providerProfileController.updateLocation);
router.put("/online-status", providerProfileController.toggleOnlineStatus);
router.post("/request-approval", providerProfileController.requestApproval);

module.exports = router;
