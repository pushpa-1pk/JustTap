const ApiError = require("../utils/ApiError");
const customerProfileRepository = require("../repositories/customer-profile.repository");
const addressRepository = require("../repositories/address.repository");
const authClientService = require("./auth-client.service");
const logger = require("./logger.service");
const {
  PROFILE_COMPLETE_THRESHOLD,
} = require("../constants/profile.constants");

class CustomerProfileService {
  async createProfile(userId, data) {
    try {
      const existingProfile = await customerProfileRepository.exists(userId);
      if (existingProfile) {
        throw new ApiError(400, "Profile already exists for this user");
      }

      const profile = await customerProfileRepository.create({
        userId,
        ...data,
      });

      const completion = profile.calculateCompletion();
      profile.profileCompletion = completion;
      await profile.save();

      await authClientService.updateProfileStatus(
        userId,
        completion >= PROFILE_COMPLETE_THRESHOLD
      );

      logger.info("CUSTOMER_PROFILE_CREATED", { userId });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("CREATE_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to create profile");
    }
  }

  async getProfile(userId) {
    try {
      const profile = await customerProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("GET_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to fetch profile");
    }
  }

  async updateProfile(userId, data) {
    try {
      const profile = await customerProfileRepository.update(userId, data);
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

      logger.info("CUSTOMER_PROFILE_UPDATED", { userId });
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("UPDATE_PROFILE_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to update profile");
    }
  }

  async getProfileWithAddresses(userId) {
    try {
      const profile = await customerProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new ApiError(404, "Profile not found");
      }

      const addresses = await addressRepository.findByUserId(userId);
      return {
        profile: profile.toObject(),
        addresses,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("GET_PROFILE_WITH_ADDRESSES_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to fetch profile");
    }
  }
}

module.exports = new CustomerProfileService();
