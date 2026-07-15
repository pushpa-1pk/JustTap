const PresenceRepository = require("../repositories/presence.repository");
const LocationRepository = require("../repositories/location.repository");
const LocationService = require("../services/location.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class LocationController {
  constructor() {
    this.locationService = new LocationService(
      new PresenceRepository(),
      new LocationRepository()
    );
  }

  updateLocation = asyncHandler(async (req, res) => {
    const providerId = req.user.userId;
    const result = await this.locationService.updateLocation(
      providerId,
      req.validatedBody
    );

    new ApiResponse(200, "Provider location updated successfully", result).send(res);
  });

  getMyLocation = asyncHandler(async (req, res) => {
    const providerId = req.user.userId;
    const coordinates = await this.locationService.getCurrentLocation(providerId);

    new ApiResponse(200, "Provider location retrieved successfully", coordinates).send(
      res
    );
  });
}

module.exports = new LocationController();
