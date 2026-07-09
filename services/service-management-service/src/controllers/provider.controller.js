const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const providerServiceService = require("../services/provider-service.service");
const customSkillService = require("../services/custom-skill.service");

class ProviderController {
  addService = asyncHandler(async (req, res) => {
    const providerService = await providerServiceService.addService(
      req.user.id,
      req.accessToken,
      req.body
    );

    return res
      .status(201)
      .json(new ApiResponse(201, "Provider service created successfully", providerService));
  });

  listServices = asyncHandler(async (req, res) => {
    const items = await providerServiceService.getProviderServices(req.user.id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Provider services retrieved successfully", items));
  });

  updateService = asyncHandler(async (req, res) => {
    const providerService = await providerServiceService.updateService(
      req.params.providerServiceId,
      req.user.id,
      req.accessToken,
      req.body
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Provider service updated successfully", providerService));
  });

  updateServiceStatus = asyncHandler(async (req, res) => {
    const providerService = await providerServiceService.updateServiceStatus(
      req.params.providerServiceId,
      req.user.id,
      req.accessToken,
      req.body.isAvailable
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Provider service status updated successfully", providerService));
  });

  deleteService = asyncHandler(async (req, res) => {
    const result = await providerServiceService.deleteService(
      req.params.providerServiceId,
      req.user.id,
      req.accessToken
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result.message, result));
  });

  createCustomSkill = asyncHandler(async (req, res) => {
    const skill = await customSkillService.createCustomSkill(
      req.user.id,
      req.accessToken,
      req.body
    );

    return res
      .status(201)
      .json(new ApiResponse(201, "Custom skill created successfully", skill));
  });

  listCustomSkills = asyncHandler(async (req, res) => {
    const items = await customSkillService.getProviderCustomSkills(req.user.id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skills retrieved successfully", items));
  });

  updateCustomSkill = asyncHandler(async (req, res) => {
    const skill = await customSkillService.updateCustomSkill(
      req.params.customSkillId,
      req.user.id,
      req.accessToken,
      req.body
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom skill updated successfully", skill));
  });

  deleteCustomSkill = asyncHandler(async (req, res) => {
    const result = await customSkillService.deleteCustomSkill(
      req.params.customSkillId,
      req.user.id,
      req.accessToken
    );

    return res.status(200).json(new ApiResponse(200, result.message, result));
  });
}

module.exports = new ProviderController();
