const ApprovalRequest = require("../models/approval-request.model");

class ApprovalRequestRepository {
  async create(data) {
    return await ApprovalRequest.create(data);
  }

  async findById(id) {
    return await ApprovalRequest.findById(id);
  }

  async findByProviderId(providerId) {
    return await ApprovalRequest.findOne({ providerId }).sort({ createdAt: -1 });
  }

  async update(id, data) {
    return await ApprovalRequest.findByIdAndUpdate(id, data, { new: true });
  }

  async findPendingRequests(limit = 50, skip = 0) {
    return await ApprovalRequest.find({ status: "pending" })
      .limit(limit)
      .skip(skip)
      .sort({ submittedAt: -1 });
  }

  async countPendingRequests() {
    return await ApprovalRequest.countDocuments({ status: "pending" });
  }

  async updateStatus(id, status, reviewedBy = null) {
    const updateData = {
      status,
      reviewedAt: new Date(),
    };

    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }

    return await ApprovalRequest.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new ApprovalRequestRepository();
