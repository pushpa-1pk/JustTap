class CapabilityService {
  constructor(serviceManagementClient) {
    this.serviceClient = serviceManagementClient;
  }

  async filterProvidersByService(providers, serviceId, trackingMeta = {}) {
    if (!providers?.length) return [];
    if (!serviceId) return providers;

    const providerIds = providers.map((provider) => provider.providerId);
    const capabilities = await this.serviceClient.getProvidersOfferingService(
      providerIds,
      serviceId,
      trackingMeta.requestId
    );

    const capabilityMap = new Map(
      capabilities.map((capability) => [capability.providerId, capability])
    );

    return providers
      .filter((provider) => capabilityMap.has(provider.providerId))
      .map((provider) => {
        const capability = capabilityMap.get(provider.providerId);
        return {
          ...provider,
          pricing: capability.pricing,
          experienceYears: capability.experienceYears,
          providerServiceId: capability.providerServiceId,
        };
      });
  }
}

module.exports = CapabilityService;
