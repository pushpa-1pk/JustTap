const express = require("express");
const internalController = require("../controllers/internal.controller");
const { requireInternalApiKey } = require("../middlewares/internal-auth.middleware");

const router = express.Router();

router.post(
  "/providers/filter",
  requireInternalApiKey,
  internalController.filterProvidersByService
);

module.exports = router;
