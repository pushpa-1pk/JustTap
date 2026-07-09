const ProviderService = require("../models/provider-service.model");

class ProviderServiceRepository {
  async create(data) {
    return ProviderService.create(data);
  }

  async findById(id) {
    return ProviderService.findById(id).populate({
      path: "serviceId",
      populate: { path: "categoryId", select: "name slug icon" },
    });
  }

  async findByProviderId(providerId, { includeInactive = false } = {}) {
    const filter = { providerId };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return ProviderService.find(filter)
      .populate({
        path: "serviceId",
        populate: { path: "categoryId", select: "name slug icon" },
      })
      .sort({ createdAt: -1 });
  }

  async findByProviderIdAndServiceId(providerId, serviceId) {
    return ProviderService.findOne({ providerId, serviceId });
  }

  async findOwnedById(id, providerId) {
    return ProviderService.findOne({ _id: id, providerId });
  }

  async countByServiceId(serviceId, { includeInactive = false } = {}) {
    const filter = { serviceId };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return ProviderService.countDocuments(filter);
  }

  async search({
    serviceId,
    categoryId,
    providerId,
    minPrice,
    maxPrice,
    minExperience,
    isAvailable = true,
    skip,
    limit,
  } = {}) {
    const filter = { isActive: true };

    if (typeof isAvailable === "boolean") {
      filter.isAvailable = isAvailable;
    }

    if (providerId) {
      filter.providerId = providerId;
    }

    if (serviceId) {
      filter.serviceId = serviceId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (minExperience !== undefined) {
      filter.experience = { $gte: minExperience };
    }

    const serviceFilter = { isActive: true };
    if (categoryId) {
      serviceFilter.categoryId = categoryId;
    }

    const query = ProviderService.find(filter)
      .populate({
        path: "serviceId",
        match: serviceFilter,
        populate: { path: "categoryId", select: "name slug icon" },
      })
      .sort({ price: 1 });

    if (Number.isInteger(skip) && skip > 0) {
      query.skip(skip);
    }

    if (Number.isInteger(limit) && limit > 0) {
      query.limit(limit);
    }

    const items = await query;
    const filtered = items.filter((item) => item.serviceId);

    return {
      items: filtered,
      total: filtered.length,
    };
  }

  async update(id, data) {
    return ProviderService.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return ProviderService.deleteOne({ _id: id });
  }
}

module.exports = new ProviderServiceRepository();
