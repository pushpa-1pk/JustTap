const express = require("express");
const {
  allowInternalOrAuthenticated,
  requireInternalApiKey,
} = require("../middlewares/internal-auth.middleware");
const internalController = require("../controllers/internal.controller");

const router = express.Router();

router.get(
  "/providers/:userId",
  allowInternalOrAuthenticated,
  internalController.getProviderByUserId
);
router.patch(
  "/providers/:userId/rating",
  requireInternalApiKey,
  internalController.updateProviderReviewMetrics
);
router.post(
  "/providers/service-area",
  requireInternalApiKey,
  internalController.getProvidersServiceAreaStatus
);
router.post(
  "/providers/metadata-batch",
  requireInternalApiKey,
  internalController.getProviderMetadataBatch
);

module.exports = router;
