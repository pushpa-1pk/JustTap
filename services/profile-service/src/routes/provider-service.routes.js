const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const providerServiceController = require("../controllers/provider-service.controller");

router.post("/", verifyToken, providerServiceController.addService);
router.get("/", verifyToken, providerServiceController.getServices);
router.put("/:id", verifyToken, providerServiceController.updateService);
router.delete("/:id", verifyToken, providerServiceController.deleteService);

module.exports = router;
