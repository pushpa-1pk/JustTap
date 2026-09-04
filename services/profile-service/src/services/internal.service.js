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

  async getProvidersBatch(userIds, options = {}) {
    let profiles = [];
    if (options.allApproved) {
      profiles = await providerProfileRepository.findAll({ verificationStatus: { $ne: "rejected" } });
    } else {
      profiles = await providerProfileRepository.findByUserIds(userIds);
    }

    return profiles.map((profile) => ({
      providerId: profile.userId || (profile._id ? profile._id.toString() : null),
      userId: profile.userId,
      profileId: profile._id ? profile._id.toString() : profile.userId,
      businessName: profile.businessName,
      experience: profile.experience,
      workingRadius: profile.workingRadius,
      currentLocation: profile.currentLocation,
      verificationStatus: profile.verificationStatus,
      rating: profile.rating ?? 0,
      totalJobs: profile.totalJobs ?? 0,
      isOnline: profile.isOnline ?? false,
      isAvailable: profile.isAvailable ?? true,
      subServices: profile.subServices || [],
      primaryCategory: profile.primaryCategory || "",
      baseRate: profile.baseRate || 499,
      profileImage: profile.profileImage || "",
    }));
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
      providerId: String(profile.userId || profile._id),
      userId: String(profile.userId || profile._id),
      profileId: profile._id ? String(profile._id) : String(profile.userId),
      fullName: profile.fullName || profile.businessName || "JustTap Provider",
      businessName: profile.businessName || profile.fullName || null,
      profilePhotoUrl: profile.profileImage || null,
      profileImage: profile.profileImage || null,
      isVerified: profile.verificationStatus !== "rejected",
      languages: ["English"],
      isOnline: Boolean(profile.isOnline),
      nextAvailableTime: profile.isOnline ? "Available Now" : "Offline",
      metrics: {
        rating: Number(profile.rating || 0),
        completedJobs: Number(profile.totalJobs || 0),
        experienceYears: Number(profile.experience || 0),
        acceptanceRate: 100,
      },
    }));
  }

  async updateProviderReviewMetrics(userId, payload) {
    const profile = await providerProfileRepository.updateReviewMetrics(userId, {
      averageRating: payload.averageRating,
      totalJobs: payload.totalReviews,
    });

    if (!profile) {
      throw new ApiError(404, "Provider profile not found");
    }

    return {
      userId: profile.userId,
      rating: profile.rating ?? 0,
      totalJobs: profile.totalJobs ?? 0,
    };
  }
}

module.exports = new InternalService();
