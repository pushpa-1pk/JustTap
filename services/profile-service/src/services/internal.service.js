const ApiError = require("../utils/ApiError");
const providerProfileRepository = require("../repositories/provider-profile.repository");

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
}

module.exports = new InternalService();
