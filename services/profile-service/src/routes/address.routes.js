const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { generalRateLimiter } = require("../middlewares/rate-limit.middleware");
const addressController = require("../controllers/address.controller");

router.use(generalRateLimiter, verifyToken);
router.post("/", addressController.createAddress);
router.get("/", addressController.getUserAddresses);
router.get("/:id", addressController.getAddress);
router.put("/:id", addressController.updateAddress);
router.put("/:id/set-primary", addressController.setPrimaryAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
