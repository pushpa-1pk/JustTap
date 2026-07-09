const ApiError = require("../utils/ApiError");
const { toSlug } = require("../utils/slug.util");
const categoryRepository = require("../repositories/category.repository");
const serviceRepository = require("../repositories/service.repository");
const providerServiceRepository = require("../repositories/provider-service.repository");
const logger = require("./logger.service");

class ServiceCatalogService {
  async createService(data) {
    const category = await categoryRepository.findById(data.categoryId);

    if (!category || !category.isActive) {
      throw new ApiError(404, "Category not found.");
    }

    const slug = data.slug || toSlug(data.name);

    const [existingName, existingSlug] = await Promise.all([
      serviceRepository.findByCategoryAndName(data.categoryId, data.name),
      serviceRepository.findByCategoryAndSlug(data.categoryId, slug),
    ]);

    if (existingName) {
      throw new ApiError(409, "Service name already exists in this category.");
    }

    if (existingSlug) {
      throw new ApiError(409, "Service slug already exists in this category.");
    }

    const service = await serviceRepository.create({
      ...data,
      slug,
    });

    logger.info("SERVICE_CREATED", {
      serviceId: service._id,
      categoryId: data.categoryId,
    });

    return service;
  }

  async getServices({
    categoryId,
    includeInactive = false,
    isPopular,
    keyword,
    page = 1,
    limit = 50,
  } = {}) {
    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category || (!includeInactive && !category.isActive)) {
        throw new ApiError(404, "Category not found.");
      }
    }

    const skip = (page - 1) * limit;
    return serviceRepository.findAll({
      categoryId,
      includeInactive,
      isPopular,
      keyword,
      skip,
      limit,
    });
  }

  async getServiceById(id, { includeInactive = false } = {}) {
    const service = await serviceRepository.findById(id);

    if (!service || (!includeInactive && !service.isActive)) {
      throw new ApiError(404, "Service not found.");
    }

    if (
      !includeInactive &&
      service.categoryId &&
      service.categoryId.isActive === false
    ) {
      throw new ApiError(404, "Service not found.");
    }

    return service;
  }

  async updateService(id, data) {
    const service = await serviceRepository.findById(id);

    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    const categoryId = data.categoryId || service.categoryId._id || service.categoryId;

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new ApiError(404, "Category not found.");
      }
    }

    if (data.name && data.name.toLowerCase() !== service.name.toLowerCase()) {
      const existingName = await serviceRepository.findByCategoryAndName(
        categoryId,
        data.name
      );
      if (existingName && existingName._id.toString() !== id) {
        throw new ApiError(409, "Service name already exists in this category.");
      }
    }

    if (data.slug || data.name) {
      const slug = data.slug || toSlug(data.name || service.name);
      const existingSlug = await serviceRepository.findByCategoryAndSlug(
        categoryId,
        slug
      );
      if (existingSlug && existingSlug._id.toString() !== id) {
        throw new ApiError(409, "Service slug already exists in this category.");
      }
      data.slug = slug;
    }

    const updated = await serviceRepository.update(id, data);
    logger.info("SERVICE_UPDATED", { serviceId: id });
    return updated;
  }

  async deleteService(id) {
    const service = await serviceRepository.findById(id);

    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    const providerCount = await providerServiceRepository.countByServiceId(id, {
      includeInactive: true,
    });

    if (providerCount > 0) {
      throw new ApiError(
        409,
        "Cannot delete service while providers are offering it."
      );
    }

    const deleted = await serviceRepository.softDelete(id);
    logger.info("SERVICE_DELETED", { serviceId: id });
    return deleted;
  }
}

module.exports = new ServiceCatalogService();
