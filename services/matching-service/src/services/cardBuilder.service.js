class CardBuilderService {
  buildProviderCards(rankedCandidates, metadataProfiles) {
    const metadataMap = new Map(
      (metadataProfiles || []).map((item) => [item.providerId, item])
    );

    return rankedCandidates.map((candidate) => {
      const metadata = metadataMap.get(candidate.providerId) || {};

      return {
        providerId: candidate.providerId,
        providerServiceId: candidate.providerServiceId || null,
        fullName: metadata.fullName || metadata.businessName || "JustTap Provider",
        businessName: metadata.businessName || null,
        profilePhotoUrl: metadata.profilePhotoUrl || null,
        isVerified: Boolean(metadata.isVerified),
        languages: metadata.languages || ["English"],
        distance: candidate.distance,
        distanceUnit: candidate.distanceUnit,
        etaMinutes: candidate.etaMinutes,
        matchingScore: candidate.matchingScore,
        pricing: candidate.pricing || null,
        metrics: {
          rating: candidate.metrics.rating,
          completedJobs: candidate.metrics.completedJobs,
          experienceYears: candidate.metrics.experienceYears,
          acceptanceRate: candidate.metrics.acceptanceRate,
        },
        availability: {
          status: candidate.availabilityStatus || "ONLINE",
          nextAvailableTime: metadata.nextAvailableTime || "Available Now",
        },
      };
    });
  }
}

module.exports = CardBuilderService;
