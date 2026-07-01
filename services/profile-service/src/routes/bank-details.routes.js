const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const bankDetailsController = require("../controllers/bank-details.controller");

router.post("/", verifyToken, bankDetailsController.addBankDetails);
router.get("/", verifyToken, bankDetailsController.getBankDetails);
router.put("/", verifyToken, bankDetailsController.updateBankDetails);
router.delete("/", verifyToken, bankDetailsController.deleteBankDetails);

module.exports = router;
