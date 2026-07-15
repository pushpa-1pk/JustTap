const searchContainer = require("../bootstrap/search.container");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const crypto = require("crypto");

class SearchController {
  constructor() {
    this.searchService = searchContainer.getSearchService();
  }

  searchProviders = asyncHandler(async (req, res) => {
    const trackingMeta = {
      requestId: req.headers["x-request-id"] || crypto.randomUUID(),
      customerId: req.user?.userId || "anonymous_customer",
    };

    const result = await this.searchService.searchNearbyProviders(
      req.validatedBody,
      trackingMeta
    );

    new ApiResponse(200, "Providers retrieved successfully", result).send(res);
  });
}

module.exports = new SearchController();
