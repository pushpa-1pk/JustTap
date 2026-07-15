const PROVIDER_STATUS = require("../constants/providerStatus");
const ApiError = require("../utils/ApiError");

class PresenceService {
  constructor(presenceRepository, locationRepository) {
    this.presenceRepo = presenceRepository;
    this.locationRepo = locationRepository;
    this.allowedTransitions = {
      [PROVIDER_STATUS.OFFLINE]: [PROVIDER_STATUS.ONLINE],
      [PROVIDER_STATUS.ONLINE]: [
        PROVIDER_STATUS.OFFLINE,
        PROVIDER_STATUS.BUSY,
        PROVIDER_STATUS.ON_BREAK,
        PROVIDER_STATUS.IN_SERVICE,
      ],
      [PROVIDER_STATUS.BUSY]: [
        PROVIDER_STATUS.ONLINE,
        PROVIDER_STATUS.OFFLINE,
        PROVIDER_STATUS.IN_SERVICE,
      ],
      [PROVIDER_STATUS.ON_BREAK]: [
        PROVIDER_STATUS.ONLINE,
        PROVIDER_STATUS.OFFLINE,
      ],
      [PROVIDER_STATUS.IN_SERVICE]: [
        PROVIDER_STATUS.ONLINE,
        PROVIDER_STATUS.BUSY,
        PROVIDER_STATUS.OFFLINE,
      ],
    };
  }

  async setStatus(providerId, status, activeBookingId = null) {
    const currentPresence = await this.getProviderPresence(providerId);
    const currentStatus = currentPresence.status;

    if (currentStatus !== status) {
      const validNextStates = this.allowedTransitions[currentStatus] || [];
      if (!validNextStates.includes(status)) {
        throw new ApiError(
          `Invalid provider state transition from ${currentStatus} to ${status}.`,
          400
        );
      }
    }

    const updatedPresence = {
      providerId,
      status,
      activeBookingId: activeBookingId || null,
      lastSeen: new Date().toISOString(),
      locationUpdatedAt: currentPresence.locationUpdatedAt || null,
      location: currentPresence.location || null,
      updatedAt: new Date().toISOString(),
      version: Number(currentPresence.version || 0) + 1,
    };

    await this.presenceRepo.savePresence(providerId, updatedPresence);

    if (status === PROVIDER_STATUS.OFFLINE) {
      await this.locationRepo.removeLocation(providerId);
    }

    return updatedPresence;
  }

  async getProviderPresence(providerId) {
    const presence = await this.presenceRepo.getPresence(providerId);
    if (!presence) {
      return {
        providerId,
        status: PROVIDER_STATUS.OFFLINE,
        activeBookingId: null,
        lastSeen: null,
        locationUpdatedAt: null,
        location: null,
        version: 0,
      };
    }

    return presence;
  }
}

module.exports = PresenceService;
