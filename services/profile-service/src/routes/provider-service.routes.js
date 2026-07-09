const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { providerRateLimiter } = require("../middlewares/rate-limit.middleware");
const providerServiceController = require("../controllers/provider-service.controller");

router.use(providerRateLimiter, verifyToken, verifyRole(["provider"]));
router.post("/", providerServiceController.addService);
router.get("/", providerServiceController.getServices);
router.put("/:id", providerServiceController.updateService);
router.delete("/:id", providerServiceController.deleteService);

module.exports = router;
