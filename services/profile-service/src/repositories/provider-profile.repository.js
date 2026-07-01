const ProviderProfile = require("../models/provider-profile.model");

class ProviderProfileRepository {
  async create(data) {
    return await ProviderProfile.create(data);
  }

  async findByUserId(userId) {
    return await ProviderProfile.findOne({ userId });
  }

  async findById(id) {
    return await ProviderProfile.findById(id);
  }

  async update(userId, data) {
    return await ProviderProfile.findOneAndUpdate({ userId }, data, { new: true });
  }

  async findByVerificationStatus(status) {
    return await ProviderProfile.find({ verificationStatus: status });
  }

  async updateLocation(userId, latitude, longitude) {
    return await ProviderProfile.findOneAndUpdate(
      { userId },
      {
        currentLocation: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );
  }

  async findNearbyProviders(longitude, latitude, maxDistance = 10000, filters = {}) {
    const query = {
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance * 1000,
        },
      },
      verificationStatus: "approved",
      isOnline: true,
      ...filters,
    };
    return await ProviderProfile.find(query).limit(10);
  }

  async updateVerificationStatus(userId, status, approvedBy = null) {
    const updateData = {
      verificationStatus: status,
    };

    if (status === "approved") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
    }

    return await ProviderProfile.findOneAndUpdate({ userId }, updateData, { new: true });
  }

  async delete(userId) {
    return await ProviderProfile.deleteOne({ userId });
  }

  async exists(userId) {
    return await ProviderProfile.exists({ userId });
  }
}

module.exports = new ProviderProfileRepository();
