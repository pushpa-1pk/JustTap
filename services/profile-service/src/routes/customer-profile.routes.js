const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const customerProfileController = require("../controllers/customer-profile.controller");

router.post("/", verifyToken, customerProfileController.createProfile);
router.get("/", verifyToken, customerProfileController.getProfile);
router.put("/", verifyToken, customerProfileController.updateProfile);
router.get("/with-addresses", verifyToken, customerProfileController.getProfileWithAddresses);

module.exports = router;
