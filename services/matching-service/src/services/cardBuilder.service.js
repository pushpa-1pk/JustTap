class CardBuilderService {
  buildProviderCards(rankedCandidates, metadataProfiles) {
    const metadataMap = new Map();
    (metadataProfiles || []).forEach((item) => {
      if (item.providerId) metadataMap.set(String(item.providerId), item);
      if (item.userId) metadataMap.set(String(item.userId), item);
      if (item.profileId) metadataMap.set(String(item.profileId), item);
      if (item._id) metadataMap.set(String(item._id), item);
    });

    return rankedCandidates.map((candidate) => {
      const pKey = String(candidate.providerId || candidate.userId || candidate._id || "");
      const metadata = metadataMap.get(pKey) || metadataMap.get(String(candidate.providerId)) || {};

      return {
        providerId: candidate.providerId,
        providerServiceId: candidate.providerServiceId || null,
        fullName: metadata.fullName || metadata.businessName || "JustTap Provider",
        businessName: metadata.businessName || null,
        profilePhotoUrl: metadata.profilePhotoUrl || metadata.profileImage || null,
        profileImage: metadata.profilePhotoUrl || metadata.profileImage || null,
        isVerified: Boolean(metadata.isVerified),
        languages: metadata.languages || ["English"],
        distance: candidate.distance,
        distanceUnit: candidate.distanceUnit,
        workingRadiusKm: candidate.workingRadiusKm,
        etaMinutes: candidate.etaMinutes,
        matchingScore: candidate.matchingScore,
        pricing: candidate.pricing || null,
        metrics: {
          rating: candidate.metrics?.rating ?? 0,
          completedJobs: candidate.metrics?.completedJobs ?? 0,
          experienceYears: candidate.metrics?.experienceYears ?? 0,
          acceptanceRate: candidate.metrics?.acceptanceRate ?? 100,
        },
        isOnline: candidate.availabilityStatus === "ONLINE" || Boolean(metadata.isOnline),
        availability: {
          status: candidate.availabilityStatus || (metadata.isOnline ? "ONLINE" : "OFFLINE"),
          nextAvailableTime: metadata.nextAvailableTime || "Available Now",
        },
      };
    });
  }
}

module.exports = CardBuilderService;
