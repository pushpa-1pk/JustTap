const express = require("express");

const internalController = require("../controllers/internal.controller");
const {
  requireInternalApiKey,
} = require("../middlewares/internal-auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  updateProfileStatusSchema,
} = require("../validators/internal.validator");

const router = express.Router();

router.patch(
  "/users/:userId/profile-status",
  requireInternalApiKey,
  validate(updateProfileStatusSchema),
  internalController.updateProfileStatus
);

module.exports = router;
