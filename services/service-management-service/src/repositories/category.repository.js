const Category = require("../models/category.model");

class CategoryRepository {
  async create(data) {
    return Category.create(data);
  }

  async findById(id) {
    return Category.findById(id);
  }

  async findBySlug(slug) {
    return Category.findOne({ slug });
  }

  async findByName(name) {
    return Category.findOne({ name: new RegExp(`^${name}$`, "i") });
  }

  async findAll({ includeInactive = false, skip = 0, limit = 100 } = {}) {
    const filter = includeInactive ? {} : { isActive: true };

    const [items, total] = await Promise.all([
      Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit),
      Category.countDocuments(filter),
    ]);

    return { items, total };
  }

  async update(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id, updatedBy) {
    return Category.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy },
      { new: true }
    );
  }
}

module.exports = new CategoryRepository();
