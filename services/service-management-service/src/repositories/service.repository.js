const Service = require("../models/service.model");

class ServiceRepository {
  async create(data) {
    return Service.create(data);
  }

  async findById(id) {
    return Service.findById(id).populate("categoryId", "name slug icon isActive");
  }

  async findByCategoryAndName(categoryId, name) {
    return Service.findOne({
      categoryId,
      name: new RegExp(`^${name}$`, "i"),
    });
  }

  async findByCategoryAndSlug(categoryId, slug) {
    return Service.findOne({ categoryId, slug });
  }

  async findAll({
    categoryId,
    includeInactive = false,
    isPopular,
    keyword,
    skip = 0,
    limit = 50,
  } = {}) {
    const filter = {};

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (!includeInactive) {
      filter.isActive = true;
    }

    if (typeof isPopular === "boolean") {
      filter.isPopular = isPopular;
    }

    if (keyword) {
      filter.$text = { $search: keyword };
    }

    const query = Service.find(filter)
      .populate("categoryId", "name slug icon isActive")
      .sort(keyword ? { score: { $meta: "textScore" } } : { name: 1 })
      .skip(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      query,
      Service.countDocuments(filter),
    ]);

    return { items, total };
  }

  async countByCategoryId(categoryId, { includeInactive = false } = {}) {
    const filter = { categoryId };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return Service.countDocuments(filter);
  }

  async update(id, data) {
    return Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id) {
    return Service.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = new ServiceRepository();
