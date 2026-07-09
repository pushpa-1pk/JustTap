const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const providerServiceService = require("../services/provider-service.service");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const { addProviderService, updateProviderService } = require("../validators/provider-service.validator");

class ProviderServiceController {
  addService = asyncHandler(async (req, res) => {
    const { error, value } = addProviderService.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const service = await providerServiceService.addService(providerProfile._id.toString(), value);
    res.status(201).json(new ApiResponse(201, "Service added successfully", service));
  });

  getServices = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const services = await providerServiceService.getProviderServices(providerProfile._id.toString());
    res.status(200).json(new ApiResponse(200, "Services retrieved successfully", services));
  });

  updateService = asyncHandler(async (req, res) => {
    const { error, value } = updateProviderService.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const service = await providerServiceService.updateService(
      req.params.id,
      providerProfile._id.toString(),
      value
    );
    res.status(200).json(new ApiResponse(200, "Service updated successfully", service));
  });

  deleteService = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const result = await providerServiceService.deleteService(
      req.params.id,
      providerProfile._id.toString()
    );
    res.status(200).json(new ApiResponse(200, result.message));
  });
}

module.exports = new ProviderServiceController();
