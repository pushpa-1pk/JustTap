const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const addressController = require("../controllers/address.controller");

router.post("/", verifyToken, addressController.createAddress);
router.get("/", verifyToken, addressController.getUserAddresses);
router.get("/:id", verifyToken, addressController.getAddress);
router.put("/:id", verifyToken, addressController.updateAddress);
router.put("/:id/set-primary", verifyToken, addressController.setPrimaryAddress);
router.delete("/:id", verifyToken, addressController.deleteAddress);

module.exports = router;
