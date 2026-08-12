const ApiError = require("../utils/ApiError");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const documentRepository = require("../repositories/document.repository");
const bankDetailsRepository = require("../repositories/bank-details.repository");
const approvalRequestRepository = require("../repositories/approval-request.repository");
const authClientService = require("./auth-client.service");
const logger = require("./logger.service");
const {
  PROFILE_COMPLETE_THRESHOLD,
} = require("../constants/profile.constants");

class ProviderProfileService {
  async createProfile(userId, data) {
    try {
      const existingProfile = await providerProfileRepository.exists(userId);
      if (existingProfile) {
        throw new ApiError(400, "Profile already exists for this user");
      }

      const profile = await providerProfileRepository.create({
        userId,
        businessName: data.businessName,
        experience: data.experience,
        workingRadius: data.workingRadius,
        currentLocation: {
          type: "Point",
          coordinates: [data.longitude, data.latitude],
        },
        workingHours: data.workingHours,
        bio: data.bio || "",
        profileImage: data.profileImage || "",
        profileImageStorageProvider: data.profileImageStorageProvider || null,
        profileImageStorageKey: data.profileImageStorageKey || null,
        verificationStatus: "pending",
      });

      const completion = profile.calculateCompletion();
      profile.profileCompletion = completion;
      await profile.save();

      await authClientService.updateProfileStatus(
        userId,
        completion >= PROFILE_COMPLETE_THRESHOLD
      );

      logger.info("PROVIDER_PROFILE_CREATED", { userId });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("CREATE_PROVIDER_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to create profile");
    }
  }

  async getProfile(userId) {
    try {
      const profile = await providerProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("GET_PROVIDER_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to fetch profile");
    }
  }

  async updateProfile(userId, data) {
    try {
      const payload = { ...data };

      if (payload.latitude !== undefined && payload.longitude !== undefined) {
        payload.currentLocation = {
          type: "Point",
          coordinates: [payload.longitude, payload.latitude],
        };
      }

      delete payload.latitude;
      delete payload.longitude;

      const profile = await providerProfileRepository.update(userId, payload);
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }

      const completion = profile.calculateCompletion();
      profile.profileCompletion = completion;
      await profile.save();

      await authClientService.updateProfileStatus(
        userId,
        completion >= PROFILE_COMPLETE_THRESHOLD
      );

      logger.info("PROVIDER_PROFILE_UPDATED", { userId });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("UPDATE_PROVIDER_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to update profile");
    }
  }

  async updateLocation(userId, latitude, longitude) {
    try {
      const profile = await providerProfileRepository.updateLocation(userId, latitude, longitude);
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }

      logger.info("PROVIDER_LOCATION_UPDATED", { userId, latitude, longitude });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("UPDATE_LOCATION_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to update location");
    }
  }

  async toggleOnlineStatus(userId, isOnline) {
    try {
      const profile = await providerProfileRepository.update(userId, { isOnline });
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }

      logger.info("PROVIDER_ONLINE_STATUS_CHANGED", { userId, isOnline });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("TOGGLE_ONLINE_STATUS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to update online status");
    }
  }

  async findNearbyProviders(longitude, latitude, maxDistance = 10) {
    try {
      const providers = await providerProfileRepository.findNearbyProviders(
        longitude,
        latitude,
        maxDistance
      );
      return providers;
    } catch (error) {
      logger.error("FIND_NEARBY_PROVIDERS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to find nearby providers");
    }
  }

  async requestApproval(userId) {
    try {
      const profile = await providerProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new ApiError(404, "Provider profile not found");
      }

      if (profile.profileCompletion < 80) {
        throw new ApiError(400, "Complete at least 80% of profile before requesting approval");
      }

      // Check if all required documents are uploaded
      const profileId = profile._id.toString();
      const documents = await documentRepository.findLatestByProviderId(profileId);
      const hasAadhar = documents.some((d) => d.documentType === "aadhar");
      const hasPan = documents.some((d) => d.documentType === "pan");
      const hasProfilePhoto = documents.some((d) => d.documentType === "profile_photo");

      if (!hasAadhar || !hasPan || !hasProfilePhoto) {
        throw new ApiError(400, "Please upload all required documents (Aadhar, PAN, Profile Photo)");
      }

      // Check if bank details are added
      const bankDetails = await bankDetailsRepository.findByProviderId(profileId);
      if (!bankDetails) {
        throw new ApiError(400, "Please add bank details for payment settlement");
      }

      // Create or update approval request
      const existingRequest = await approvalRequestRepository.findByProviderId(profileId);
      let approvalRequest;

      if (existingRequest && existingRequest.status === "rejected") {
        approvalRequest = await approvalRequestRepository.update(existingRequest._id, {
          status: "pending",
          requestType: "resubmit",
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        });
      } else if (!existingRequest) {
        approvalRequest = await approvalRequestRepository.create({
          providerId: profileId,
          requestType: "initial",
          status: "pending",
          requiredDocuments: {
            aadhar: true,
            pan: true,
            profilePhoto: true,
          },
          submittedDocuments: {
            aadhar: hasAadhar,
            pan: hasPan,
            profilePhoto: hasProfilePhoto,
          },
        });
      } else {
        throw new ApiError(400, "Approval request already pending");
      }

      // Update provider profile
      profile.approvalRequestedAt = new Date();
      await profile.save();

      logger.info("APPROVAL_REQUEST_CREATED", {
        userId,
        approvalRequestId: approvalRequest._id,
      });

      return approvalRequest;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("REQUEST_APPROVAL_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to request approval");
    }
  }
}

module.exports = new ProviderProfileService();
