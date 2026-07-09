const Document = require("../models/document.model");

class DocumentRepository {
  async create(data) {
    return await Document.create(data);
  }

  async findById(id) {
    return await Document.findById(id);
  }

  async findByProviderId(providerId) {
    return await Document.find({ providerId });
  }

  async findLatestByProviderId(providerId) {
    return await Document.find({ providerId, isLatest: true });
  }

  async findByProviderIdAndType(providerId, documentType) {
    return await Document.findOne({ providerId, documentType, isLatest: true });
  }

  async update(id, data) {
    return await Document.findByIdAndUpdate(id, data, { new: true });
  }

  async updateStatus(id, status, verifiedBy = null) {
    const updateData = {
      status,
    };

    if (status === "approved") {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = verifiedBy;
    }

    return await Document.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id) {
    return await Document.deleteOne({ _id: id });
  }

  async deleteOwned(id, providerId) {
    return await Document.deleteOne({ _id: id, providerId });
  }

  async deleteByProviderId(providerId) {
    return await Document.deleteMany({ providerId });
  }

  async findPendingByProviderId(providerId) {
    return await Document.find({ providerId, status: "pending" });
  }

  async markOldVersions(providerId, documentType) {
    return await Document.updateMany(
      { providerId, documentType, isLatest: true },
      { isLatest: false }
    );
  }
}

module.exports = new DocumentRepository();
