const PROVIDER_STATUS = require("../constants/providerStatus");
const ApiError = require("../utils/ApiError");

class LocationService {
  constructor(presenceRepository, locationRepository) {
    this.presenceRepo = presenceRepository;
    this.locationRepo = locationRepository;
  }

  async updateLocation(providerId, locationData) {
    const presence = await this.presenceRepo.getPresence(providerId);
    const currentStatus = presence?.status || PROVIDER_STATUS.OFFLINE;

    if (currentStatus === PROVIDER_STATUS.OFFLINE) {
      throw new ApiError(
        "Provider must be online before updating location.",
        400
      );
    }

    await this.locationRepo.addLocation(
      providerId,
      locationData.longitude,
      locationData.latitude
    );

    await this.presenceRepo.savePresence(providerId, {
      ...(presence || {
        providerId,
        status: currentStatus,
        activeBookingId: null,
      }),
      lastSeen: new Date().toISOString(),
      locationUpdatedAt: new Date().toISOString(),
      location: {
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
      },
    });

    return {
      latitude: Number(locationData.latitude),
      longitude: Number(locationData.longitude),
      updatedAt: new Date().toISOString(),
    };
  }

  async getCurrentLocation(providerId) {
    const coordinates = await this.locationRepo.getLocation(providerId);
    if (!coordinates) {
      throw new ApiError("No live location found for this provider.", 404);
    }

    return coordinates;
  }
}

module.exports = LocationService;
