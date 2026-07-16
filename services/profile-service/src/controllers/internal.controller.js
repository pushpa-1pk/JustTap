const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const internalService = require("../services/internal.service");

class InternalController {
  getProviderByUserId = asyncHandler(async (req, res) => {
    const provider = await internalService.getProviderPublicProfile(req.params.userId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Provider profile retrieved successfully", provider));
  });

  getProvidersServiceAreaStatus = asyncHandler(async (req, res) => {
    const providers = await internalService.getProvidersServiceAreaStatus(
      req.body.providerIds || [],
      req.body.customerLocation || {}
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Provider service-area status retrieved successfully", {
          providers,
        })
      );
  });

  getProviderMetadataBatch = asyncHandler(async (req, res) => {
    const profiles = await internalService.getProviderMetadataBatch(
      req.body.providerIds || []
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Provider metadata retrieved successfully", {
          profiles,
        })
      );
  });

  updateProviderReviewMetrics = asyncHandler(async (req, res) => {
    const result = await internalService.updateProviderReviewMetrics(
      req.params.userId,
      req.body || {}
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Provider review metrics updated successfully", result));
  });
}

module.exports = new InternalController();
