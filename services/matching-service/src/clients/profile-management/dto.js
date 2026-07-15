class ProviderServiceAreaDTO {
  constructor(rawJson) {
    this.providerId = String(rawJson.providerId);
    this.withinServiceArea = Boolean(rawJson.withinServiceArea);
    this.workingRadiusKm = Number(rawJson.workingRadiusKm || 0);
  }

  static fromResponseArray(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item) => new ProviderServiceAreaDTO(item));
  }
}

class ProviderCardMetadataDTO {
  constructor(rawJson) {
    this.providerId = String(rawJson.providerId);
    this.fullName = String(rawJson.fullName || rawJson.businessName || "JustTap Provider");
    this.businessName = rawJson.businessName ? String(rawJson.businessName) : null;
    this.profilePhotoUrl = rawJson.profilePhotoUrl ? String(rawJson.profilePhotoUrl) : null;
    this.languages = Array.isArray(rawJson.languages)
      ? rawJson.languages.map(String)
      : ["English"];
    this.isVerified = Boolean(rawJson.isVerified);
    this.nextAvailableTime = rawJson.nextAvailableTime
      ? String(rawJson.nextAvailableTime)
      : "Available Now";
    this.metrics = {
      rating: Number(rawJson.rating || rawJson.metrics?.rating || 0),
      completedJobs: Number(rawJson.completedJobs || rawJson.metrics?.completedJobs || 0),
      experienceYears: Number(
        rawJson.experienceYears || rawJson.metrics?.experienceYears || 0
      ),
      acceptanceRate: Number(
        rawJson.acceptanceRate || rawJson.metrics?.acceptanceRate || 100
      ),
    };
  }

  static fromResponseArray(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item) => new ProviderCardMetadataDTO(item));
  }
}

module.exports = {
  ProviderServiceAreaDTO,
  ProviderCardMetadataDTO,
};
