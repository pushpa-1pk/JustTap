const env = require("../config/env");
const logger = require("../config/logger");
const ProviderMetricsDTO = require("../clients/profile-management/metrics.dto");

class SearchService {
  constructor(
    geoRepository,
    availabilityService,
    capabilityService,
    areaValidationService,
    etaService,
    rankingService,
    cardBuilderService,
    profileManagementClient
  ) {
    this.geoRepo = geoRepository;
    this.availabilityService = availabilityService;
    this.capabilityService = capabilityService;
    this.areaValidationService = areaValidationService;
    this.etaService = etaService;
    this.rankingService = rankingService;
    this.cardBuilderService = cardBuilderService;
    this.profileClient = profileManagementClient;
  }

  async searchNearbyProviders(searchRequestDto, trackingMeta = {}) {
    const startTime = process.hrtime.bigint();
    const radius = Number(
      searchRequestDto.radius || env.DEFAULT_SEARCH_RADIUS_KM
    );
    const limit = Number(searchRequestDto.limit || env.DEFAULT_SEARCH_LIMIT);

    const nearby = await this.geoRepo.searchNearby(
      searchRequestDto.longitude,
      searchRequestDto.latitude,
      radius,
      limit
    );
    const available = await this.availabilityService.filterAvailableProviders(nearby);
    const capable = await this.capabilityService.filterProvidersByService(
      available,
      searchRequestDto.serviceId,
      trackingMeta
    );
    const localized = await this.areaValidationService.filterProvidersByServiceArea(
      capable,
      {
        latitude: searchRequestDto.latitude,
        longitude: searchRequestDto.longitude,
      },
      trackingMeta
    );

    if (!localized.length) {
      return { total: 0, providers: [] };
    }

    const providerIds = localized.map((provider) => provider.providerId);
    const metadataProfiles = await this.profileClient.getProviderCardMetadata(
      providerIds,
      trackingMeta.requestId
    );
    const metadataMap = new Map(
      metadataProfiles.map((profile) => [profile.providerId, profile])
    );

    const enrichedCandidates = localized.map((provider) => {
      const metadata = metadataMap.get(provider.providerId) || {};
      return {
        ...provider,
        etaMinutes: this.etaService.estimateEtaMinutes(provider.distance),
        availabilityStatus: "ONLINE",
        metrics: new ProviderMetricsDTO(metadata),
      };
    });

    const ranked = await this.rankingService.rankProviders(enrichedCandidates);
    const providers = this.cardBuilderService.buildProviderCards(
      ranked,
      metadataProfiles
    );

    logger.info("matching_search_completed", {
      requestId: trackingMeta.requestId,
      customerId: trackingMeta.customerId,
      candidates: nearby.length,
      returned: providers.length,
      durationMs: Number(process.hrtime.bigint() - startTime) / 1e6,
    });

    return {
      total: providers.length,
      providers,
    };
  }
}

module.exports = SearchService;
