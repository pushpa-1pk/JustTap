const express = require("express");
const catalogController = require("../controllers/catalog.controller");
const { optionalVerifyToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  categoryIdParam,
  serviceIdParam,
  paginationQuery,
  searchProvidersQuery,
  serviceListQuery,
} = require("../validators/common.validator");

const router = express.Router();

router.get("/categories", validate(paginationQuery, "query"), catalogController.listCategories);
router.get("/categories/:categoryId", validate(categoryIdParam, "params"), catalogController.getCategory);
router.get("/services", validate(serviceListQuery, "query"), catalogController.listServices);
router.get("/services/:serviceId", validate(serviceIdParam, "params"), catalogController.getService);
router.get("/services/:serviceId/providers", optionalVerifyToken, validate(serviceIdParam, "params"), validate(searchProvidersQuery, "query"), catalogController.getServiceProviders);
router.get("/search/providers", optionalVerifyToken, validate(searchProvidersQuery, "query"), catalogController.searchProviders);

module.exports = router;
