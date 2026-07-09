const ApiError = require("../utils/ApiError");
const providerServiceRepository = require("../repositories/provider-service.repository");
const serviceRepository = require("../repositories/service.repository");
const profileClientService = require("./profile-client.service");
const logger = require("./logger.service");

class ProviderServiceManagement {
  async assertVerifiedProvider(accessToken) {
    const profile = await profileClientService.getProviderProfile(accessToken);

    if (!profile) {
      throw new ApiError(
        403,
        "Provider profile not found. Complete your profile before offering services."
      );
    }

    if (profile.verificationStatus !== "approved") {
      throw new ApiError(
        403,
        "Only verified providers can manage services."
      );
    }

    return profile;
  }

  async addService(providerId, accessToken, data) {
    await this.assertVerifiedProvider(accessToken);

    const service = await serviceRepository.findById(data.serviceId);

    if (!service || !service.isActive) {
      throw new ApiError(404, "Official service not found.");
    }

    const existing = await providerServiceRepository.findByProviderIdAndServiceId(
      providerId,
      data.serviceId
    );

    if (existing) {
      throw new ApiError(409, "You already offer this service.");
    }

    const providerService = await providerServiceRepository.create({
      providerId,
      ...data,
    });

    logger.info("PROVIDER_SERVICE_CREATED", {
      providerId,
      providerServiceId: providerService._id,
      serviceId: data.serviceId,
    });

    return providerServiceRepository.findById(providerService._id);
  }

  async getProviderServices(providerId) {
    return providerServiceRepository.findByProviderId(providerId);
  }

  async updateService(id, providerId, accessToken, data) {
    await this.assertVerifiedProvider(accessToken);

    const existing = await providerServiceRepository.findOwnedById(id, providerId);

    if (!existing) {
      throw new ApiError(404, "Provider service not found.");
    }

    const updated = await providerServiceRepository.update(id, data);

    logger.info("PROVIDER_SERVICE_UPDATED", { providerId, providerServiceId: id });
    return providerServiceRepository.findById(updated._id);
  }

  async updateServiceStatus(id, providerId, accessToken, isAvailable) {
    await this.assertVerifiedProvider(accessToken);

    const existing = await providerServiceRepository.findOwnedById(id, providerId);

    if (!existing) {
      throw new ApiError(404, "Provider service not found.");
    }

    const updated = await providerServiceRepository.update(id, { isAvailable });

    logger.info("PROVIDER_SERVICE_STATUS_UPDATED", {
      providerId,
      providerServiceId: id,
      isAvailable,
    });

    return providerServiceRepository.findById(updated._id);
  }

  async deleteService(id, providerId, accessToken) {
    await this.assertVerifiedProvider(accessToken);

    const existing = await providerServiceRepository.findOwnedById(id, providerId);

    if (!existing) {
      throw new ApiError(404, "Provider service not found.");
    }

    await providerServiceRepository.delete(id);

    logger.info("PROVIDER_SERVICE_DELETED", { providerId, providerServiceId: id });
    return { message: "Provider service removed successfully." };
  }
}

module.exports = new ProviderServiceManagement();
