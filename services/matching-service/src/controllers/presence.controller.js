const PresenceRepository = require("../repositories/presence.repository");
const LocationRepository = require("../repositories/location.repository");
const PresenceService = require("../services/presence.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class PresenceController {
  constructor() {
    this.presenceService = new PresenceService(
      new PresenceRepository(),
      new LocationRepository()
    );
  }

  updateStatus = asyncHandler(async (req, res) => {
    const providerId = req.user.userId;
    const { status, activeBookingId = null } = req.validatedBody;

    const result = await this.presenceService.setStatus(
      providerId,
      status,
      activeBookingId
    );

    new ApiResponse(200, "Provider status updated successfully", result).send(res);
  });

  getMyStatus = asyncHandler(async (req, res) => {
    const result = await this.presenceService.getProviderPresence(req.user.userId);
    new ApiResponse(200, "Provider status retrieved successfully", result).send(res);
  });
}

module.exports = new PresenceController();
