class AreaValidationService {
  constructor(profileManagementClient) {
    this.profileClient = profileManagementClient;
  }

  async filterProvidersByServiceArea(providers, customerLocation, trackingMeta = {}) {
    if (!providers?.length) return [];

    const areaProfiles = await this.profileClient.getProvidersServiceAreaStatus(
      providers.map((provider) => provider.providerId),
      customerLocation.latitude,
      customerLocation.longitude,
      trackingMeta.requestId
    );

    const areaMap = new Map(areaProfiles.map((item) => [item.providerId, item]));

    return providers
      .filter((provider) => areaMap.get(provider.providerId)?.withinServiceArea)
      .map((provider) => ({
        ...provider,
        workingRadiusKm: areaMap.get(provider.providerId)?.workingRadiusKm || null,
      }));
  }
}

module.exports = AreaValidationService;
