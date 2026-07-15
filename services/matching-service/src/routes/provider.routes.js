const express = require("express");
const presenceController = require("../controllers/presence.controller");
const locationController = require("../controllers/location.controller");
const { updateStatusSchema } = require("../validators/presence.validator");
const { updateLocationSchema } = require("../validators/location.validator");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { locationRateLimiter } = require("../middlewares/rateLimiter");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const authorizeProvider = (req, res, next) => {
  if (req.user?.role === "PROVIDER") {
    return next();
  }

  return next(new ApiError("Provider access is required.", 403));
};

router.use(authenticate);
router.use(authorizeProvider);

router
  .route("/status")
  .put(validate(updateStatusSchema), presenceController.updateStatus)
  .get(presenceController.getMyStatus);

router
  .route("/location")
  .put(locationRateLimiter, validate(updateLocationSchema), locationController.updateLocation)
  .get(locationController.getMyLocation);

module.exports = router;
