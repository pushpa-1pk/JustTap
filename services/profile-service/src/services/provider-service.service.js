const ApiError = require("../utils/ApiError");
const providerServiceRepository = require("../repositories/provider-service.repository");
const logger = require("./logger.service");

class ProviderServiceService {
  async addService(providerId, data) {
    const existing = await providerServiceRepository.findByProviderIdAndServiceId(
      providerId,
      data.serviceId
    );

    if (existing) {
      throw new ApiError(409, "Service already exists for this provider");
    }

    const service = await providerServiceRepository.create({
      providerId,
      ...data,
    });

    logger.info("PROVIDER_SERVICE_CREATED", {
      providerId,
      serviceId: service._id,
    });

    return service;
  }

  async getProviderServices(providerId) {
    return providerServiceRepository.findByProviderId(providerId);
  }

  async updateService(serviceId, providerId, data) {
    const existing = await providerServiceRepository.findOwnedById(serviceId, providerId);
    if (!existing) {
      throw new ApiError(404, "Provider service not found");
    }

    const service = await providerServiceRepository.update(serviceId, data);
    logger.info("PROVIDER_SERVICE_UPDATED", {
      providerId,
      serviceId,
    });

    return service;
  }

  async deleteService(serviceId, providerId) {
    const existing = await providerServiceRepository.findOwnedById(serviceId, providerId);
    if (!existing) {
      throw new ApiError(404, "Provider service not found");
    }

    await providerServiceRepository.delete(serviceId);
    logger.info("PROVIDER_SERVICE_DELETED", {
      providerId,
      serviceId,
    });

    return { message: "Provider service deleted successfully" };
  }
}

module.exports = new ProviderServiceService();
