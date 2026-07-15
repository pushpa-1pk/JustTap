const env = require("../config/env");
const PROVIDER_STATUS = require("../constants/providerStatus");

class AvailabilityService {
  constructor(availabilityRepository) {
    this.availabilityRepo = availabilityRepository;
  }

  async filterAvailableProviders(providers) {
    if (!providers?.length) {
      return [];
    }

    const providerIds = providers.map((provider) => provider.providerId);
    const presenceProfiles = await this.availabilityRepo.getMultiplePresence(providerIds);
    const staleThresholdMs = env.STALE_LOCATION_THRESHOLD_MINUTES * 60 * 1000;
    const now = Date.now();

    return providers.filter((provider, index) => {
      const profile = presenceProfiles[index];
      if (!profile) {
        return false;
      }

      if (profile.status !== PROVIDER_STATUS.ONLINE) {
        return false;
      }

      const locationTimestamp = profile.locationUpdatedAt
        ? new Date(profile.locationUpdatedAt).getTime()
        : 0;

      return locationTimestamp > 0 && now - locationTimestamp <= staleThresholdMs;
    });
  }
}

module.exports = AvailabilityService;
