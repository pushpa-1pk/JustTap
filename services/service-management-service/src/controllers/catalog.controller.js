const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const categoryService = require("../services/category.service");
const serviceCatalogService = require("../services/service.service");
const searchService = require("../services/search.service");

class CatalogController {
  listCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getCategories({
      page: req.query.page,
      limit: req.query.limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Categories retrieved successfully", result));
  });

  getCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.categoryId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Category retrieved successfully", category));
  });

  listServices = asyncHandler(async (req, res) => {
    const result = await serviceCatalogService.getServices({
      categoryId: req.query.categoryId,
      keyword: req.query.keyword,
      isPopular: req.query.isPopular,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Services retrieved successfully", result));
  });

  getService = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.getServiceById(req.params.serviceId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Service retrieved successfully", service));
  });

  searchProviders = asyncHandler(async (req, res) => {
    const result = await searchService.searchProviders(req.query, req.accessToken);
    return res
      .status(200)
      .json(new ApiResponse(200, "Providers retrieved successfully", result));
  });

  getServiceProviders = asyncHandler(async (req, res) => {
    const result = await searchService.getServiceWithProviders(
      req.params.serviceId,
      req.query,
      req.accessToken
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Service providers retrieved successfully", result));
  });
}

module.exports = new CatalogController();
