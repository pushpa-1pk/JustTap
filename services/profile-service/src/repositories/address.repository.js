const Address = require("../models/address.model");

class AddressRepository {
  async create(data) {
    return await Address.create(data);
  }

  async findById(id) {
    return await Address.findById(id);
  }

  async findByUserId(userId) {
    return await Address.find({ userId });
  }

  async update(id, data) {
    return await Address.findByIdAndUpdate(id, data, { new: true });
  }

  async updateOwned(id, userId, data) {
    return await Address.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  }

  async delete(id) {
    return await Address.deleteOne({ _id: id });
  }

  async deleteOwned(id, userId) {
    return await Address.deleteOne({ _id: id, userId });
  }

  async findPrimaryByUserId(userId) {
    return await Address.findOne({ userId, isPrimary: true });
  }

  async updatePrimary(userId, addressId) {
    await Address.updateMany({ userId }, { isPrimary: false });
    return await Address.findOneAndUpdate({ _id: addressId, userId }, { isPrimary: true }, { new: true });
  }

  async updateMany(filter, data) {
    return await Address.updateMany(filter, data);
  }

  async deleteByUserId(userId) {
    return await Address.deleteMany({ userId });
  }
}

module.exports = new AddressRepository();
