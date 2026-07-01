const BankDetails = require("../models/bank-details.model");

class BankDetailsRepository {
  async create(data) {
    return await BankDetails.create(data);
  }

  async findByProviderId(providerId) {
    return await BankDetails.findOne({ providerId });
  }

  async update(providerId, data) {
    return await BankDetails.findOneAndUpdate({ providerId }, data, { new: true });
  }

  async delete(providerId) {
    return await BankDetails.deleteOne({ providerId });
  }

  async exists(providerId) {
    return await BankDetails.exists({ providerId });
  }
}

module.exports = new BankDetailsRepository();
