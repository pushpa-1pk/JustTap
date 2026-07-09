const ProviderCustomSkill = require("../models/provider-custom-skill.model");

class ProviderCustomSkillRepository {
  async create(data) {
    return ProviderCustomSkill.create(data);
  }

  async findById(id) {
    return ProviderCustomSkill.findById(id);
  }

  async findByProviderId(providerId) {
    return ProviderCustomSkill.find({ providerId }).sort({ createdAt: -1 });
  }

  async findOwnedById(id, providerId) {
    return ProviderCustomSkill.findOne({ _id: id, providerId });
  }

  async findByProviderAndSkillName(providerId, skillName) {
    return ProviderCustomSkill.findOne({
      providerId,
      skillName: new RegExp(`^${skillName}$`, "i"),
    });
  }

  async findAll({ status, skip = 0, limit = 50 } = {}) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      ProviderCustomSkill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProviderCustomSkill.countDocuments(filter),
    ]);

    return { items, total };
  }

  async update(id, data) {
    return ProviderCustomSkill.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return ProviderCustomSkill.deleteOne({ _id: id });
  }
}

module.exports = new ProviderCustomSkillRepository();
