const ApiError = require("../utils/ApiError");
const providerProfileRepository = require("../repositories/provider-profile.repository");

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

class InternalService {
  async getProviderPublicProfile(userId) {
    const profile = await providerProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Provider profile not found");
    }

    return {
      userId: profile.userId,
      businessName: profile.businessName,
      experience: profile.experience,
      workingRadius: profile.workingRadius,
      currentLocation: profile.currentLocation,
      verificationStatus: profile.verificationStatus,
      rating: profile.rating ?? 0,
      totalJobs: profile.totalJobs ?? 0,
      isOnline: profile.isOnline ?? false,
      profileImage: profile.profileImage || "",
    };
  }

  async getProvidersServiceAreaStatus(providerIds, customerLocation) {
    const profiles = await providerProfileRepository.findByUserIds(providerIds);

    return profiles.map((profile) => {
      const coordinates = profile.currentLocation?.coordinates || [];
      const withinServiceArea =
        coordinates.length === 2
          ? calculateDistanceKm(
              customerLocation.latitude,
              customerLocation.longitude,
              coordinates[1],
              coordinates[0]
            ) <= Number(profile.workingRadius || 0)
          : false;

      return {
        providerId: String(profile.userId),
        withinServiceArea,
        workingRadiusKm: Number(profile.workingRadius || 0),
      };
    });
  }

  async getProviderMetadataBatch(providerIds) {
    const profiles = await providerProfileRepository.findByUserIds(providerIds);

    return profiles.map((profile) => ({
      providerId: String(profile.userId),
      fullName: profile.businessName,
      businessName: profile.businessName,
      profilePhotoUrl: profile.profileImage || null,
      isVerified: profile.verificationStatus === "approved",
      languages: ["English"],
      nextAvailableTime: profile.isOnline ? "Available Now" : "Offline",
      metrics: {
        rating: Number(profile.rating || 0),
        completedJobs: Number(profile.totalJobs || 0),
        experienceYears: Number(profile.experience || 0),
        acceptanceRate: 100,
      },
    }));
  }
}

module.exports = new InternalService();
