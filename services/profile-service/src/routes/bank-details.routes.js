const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { providerRateLimiter } = require("../middlewares/rate-limit.middleware");
const bankDetailsController = require("../controllers/bank-details.controller");

router.use(providerRateLimiter, verifyToken, verifyRole(["provider"]));
router.post("/", bankDetailsController.addBankDetails);
router.get("/", bankDetailsController.getBankDetails);
router.put("/", bankDetailsController.updateBankDetails);
router.delete("/", bankDetailsController.deleteBankDetails);

module.exports = router;
