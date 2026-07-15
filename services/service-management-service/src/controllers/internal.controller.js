const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const internalService = require("../services/internal.service");

class InternalController {
  filterProvidersByService = asyncHandler(async (req, res) => {
    const providers = await internalService.filterProvidersByService(
      req.body.providerIds || [],
      req.body.serviceId
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Provider capabilities retrieved successfully", {
          providers,
        })
      );
  });
}

module.exports = new InternalController();
