const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");
const { providerSearchSchema } = require("../validators/search.validator");

const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { searchRateLimiter } = require("../middlewares/customerRateLimiter");
const ApiError = require("../utils/ApiError");

const authorizeCustomer = (req, res, next) => {
  if (req.user?.role === "CUSTOMER") {
    return next();
  }

  return next(new ApiError("Customer access is required.", 403));
};

// Core pipeline routing configuration for customer discovery
router.post(
  "/providers", 
  authenticate, 
  authorizeCustomer,
  searchRateLimiter, 
  validate(providerSearchSchema), 
  searchController.searchProviders
);

module.exports = router;
