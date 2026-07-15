const GeoRepository = require("../repositories/geo.repository");
const AvailabilityRepository = require("../repositories/availability.repository");
const AvailabilityService = require("../services/availability.service");
const ServiceManagementClient = require("../clients/service-management/serviceManagement.client");
const CapabilityService = require("../services/capability.service");
const ProfileManagementClient = require("../clients/profile-management/profileManagement.client");
const AreaValidationService = require("../services/areaValidation.service");
const EtaService = require("../services/eta.service");
const RankingService = require("../services/ranking/ranking.service");
const CardBuilderService = require("../services/cardBuilder.service");
const SearchService = require("../services/search.service");

class SearchContainer {
  constructor() {
    this.geoRepository = new GeoRepository();
    this.availabilityRepository = new AvailabilityRepository();
    this.serviceManagementClient = new ServiceManagementClient();
    this.profileManagementClient = new ProfileManagementClient();
    this.availabilityService = new AvailabilityService(this.availabilityRepository);
    this.capabilityService = new CapabilityService(this.serviceManagementClient);
    this.areaValidationService = new AreaValidationService(this.profileManagementClient);
    this.etaService = new EtaService();
    this.rankingService = new RankingService();
    this.cardBuilderService = new CardBuilderService();
    this.searchService = new SearchService(
      this.geoRepository,
      this.availabilityService,
      this.capabilityService,
      this.areaValidationService,
      this.etaService,
      this.rankingService,
      this.cardBuilderService,
      this.profileManagementClient
    );
  }

  getSearchService() {
    return this.searchService;
  }
}

module.exports = new SearchContainer();
