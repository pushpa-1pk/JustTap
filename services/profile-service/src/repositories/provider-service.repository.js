const ProviderService = require("../models/provider-service.model");

class ProviderServiceRepository {
  async create(data) {
    return await ProviderService.create(data);
  }

  async findById(id) {
    return await ProviderService.findById(id);
  }

  async findByProviderId(providerId) {
    return await ProviderService.find({ providerId, isActive: true });
  }

  async update(id, data) {
    return await ProviderService.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await ProviderService.deleteOne({ _id: id });
  }

  async findByProviderIdAndServiceId(providerId, serviceId) {
    return await ProviderService.findOne({ providerId, serviceId });
  }

  async deleteByProviderId(providerId) {
    return await ProviderService.deleteMany({ providerId });
  }
}

module.exports = new ProviderServiceRepository();
