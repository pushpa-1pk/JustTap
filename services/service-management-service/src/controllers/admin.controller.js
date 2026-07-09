const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const categoryService = require("../services/category.service");
const serviceCatalogService = require("../services/service.service");
const customSkillService = require("../services/custom-skill.service");

class AdminController {
  createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.user.id, req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "Category created successfully", category));
  });

  listCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getCategories({
      includeInactive: req.query.includeInactive,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Categories retrieved successfully", result));
  });

  getCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.categoryId, {
      includeInactive: req.query.includeInactive,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Category retrieved successfully", category));
  });

  updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(
      req.params.categoryId,
      req.user.id,
      req.body
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Category updated successfully", category));
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.deleteCategory(
      req.params.categoryId,
      req.user.id
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Category deleted successfully", category));
  });

  createService = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.createService(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "Service created successfully", service));
  });

  listServices = asyncHandler(async (req, res) => {
    const result = await serviceCatalogService.getServices({
      categoryId: req.query.categoryId,
      includeInactive: req.query.includeInactive,
      isPopular: req.query.isPopular,
      keyword: req.query.keyword,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Services retrieved successfully", result));
  });

  getService = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.getServiceById(req.params.serviceId, {
      includeInactive: req.query.includeInactive,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Service retrieved successfully", service));
  });

  updateService = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.updateService(
      req.params.serviceId,
      req.body
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Service updated successfully", service));
  });

  deleteService = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.deleteService(req.params.serviceId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Service deleted successfully", service));
  });

  listCustomSkills = asyncHandler(async (req, res) => {
    const result = await customSkillService.listCustomSkills({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skills retrieved successfully", result));
  });

  approveCustomSkill = asyncHandler(async (req, res) => {
    const skill = await customSkillService.approveCustomSkill(
      req.params.customSkillId,
      req.user.id,
      req.body.adminRemarks
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skill approved successfully", skill));
  });

  rejectCustomSkill = asyncHandler(async (req, res) => {
    const skill = await customSkillService.rejectCustomSkill(
      req.params.customSkillId,
      req.user.id,
      req.body.adminRemarks
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skill rejected successfully", skill));
  });

  convertCustomSkill = asyncHandler(async (req, res) => {
    const result = await customSkillService.convertCustomSkillToService(
      req.params.customSkillId,
      req.user.id,
      req.body
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skill converted successfully", result));
  });
}

module.exports = new AdminController();
