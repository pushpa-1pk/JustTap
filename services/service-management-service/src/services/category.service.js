const ApiError = require("../utils/ApiError");
const { toSlug } = require("../utils/slug.util");
const categoryRepository = require("../repositories/category.repository");
const serviceRepository = require("../repositories/service.repository");
const logger = require("./logger.service");

class CategoryService {
  async createCategory(adminId, data) {
    const slug = data.slug || toSlug(data.name);

    const [existingName, existingSlug] = await Promise.all([
      categoryRepository.findByName(data.name),
      categoryRepository.findBySlug(slug),
    ]);

    if (existingName) {
      throw new ApiError(409, "Category name already exists.");
    }

    if (existingSlug) {
      throw new ApiError(409, "Category slug already exists.");
    }

    const category = await categoryRepository.create({
      ...data,
      slug,
      createdBy: adminId,
      updatedBy: adminId,
    });

    logger.info("CATEGORY_CREATED", { categoryId: category._id, adminId });
    return category;
  }

  async getCategories({ includeInactive = false, page = 1, limit = 100 } = {}) {
    const skip = (page - 1) * limit;
    return categoryRepository.findAll({ includeInactive, skip, limit });
  }

  async getCategoryById(id, { includeInactive = false } = {}) {
    const category = await categoryRepository.findById(id);

    if (!category || (!includeInactive && !category.isActive)) {
      throw new ApiError(404, "Category not found.");
    }

    return category;
  }

  async updateCategory(id, adminId, data) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new ApiError(404, "Category not found.");
    }

    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingName = await categoryRepository.findByName(data.name);
      if (existingName && existingName._id.toString() !== id) {
        throw new ApiError(409, "Category name already exists.");
      }
    }

    if (data.slug || data.name) {
      const slug = data.slug || toSlug(data.name || category.name);
      const existingSlug = await categoryRepository.findBySlug(slug);
      if (existingSlug && existingSlug._id.toString() !== id) {
        throw new ApiError(409, "Category slug already exists.");
      }
      data.slug = slug;
    }

    const updated = await categoryRepository.update(id, {
      ...data,
      updatedBy: adminId,
    });

    logger.info("CATEGORY_UPDATED", { categoryId: id, adminId });
    return updated;
  }

  async deleteCategory(id, adminId) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new ApiError(404, "Category not found.");
    }

    // Cascade soft-delete: deactivate all associated services
    await serviceRepository.deactivateByCategoryId(id);

    const deleted = await categoryRepository.softDelete(id, adminId);
    logger.info("CATEGORY_DELETED", { categoryId: id, adminId });
    return deleted;
  }
}

module.exports = new CategoryService();
