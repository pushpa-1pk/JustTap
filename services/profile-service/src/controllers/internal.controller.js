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
}

module.exports = new InternalController();
