const CustomerProfile = require("../models/customer-profile.model");

class CustomerProfileRepository {
  async create(data) {
    return await CustomerProfile.create(data);
  }

  async findByUserId(userId) {
    return await CustomerProfile.findOne({ userId });
  }

  async findById(id) {
    return await CustomerProfile.findById(id);
  }

  async update(userId, data) {
    return await CustomerProfile.findOneAndUpdate({ userId }, data, { new: true });
  }

  async delete(userId) {
    return await CustomerProfile.deleteOne({ userId });
  }

  async exists(userId) {
    return await CustomerProfile.exists({ userId });
  }
}

module.exports = new CustomerProfileRepository();
