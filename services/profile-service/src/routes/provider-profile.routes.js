const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const providerProfileController = require("../controllers/provider-profile.controller");

router.post("/", verifyToken, providerProfileController.createProfile);
router.get("/", verifyToken, providerProfileController.getProfile);
router.put("/", verifyToken, providerProfileController.updateProfile);
router.put("/location", verifyToken, providerProfileController.updateLocation);
router.put("/online-status", verifyToken, providerProfileController.toggleOnlineStatus);
router.post("/request-approval", verifyToken, providerProfileController.requestApproval);

module.exports = router;
