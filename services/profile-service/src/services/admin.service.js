const ApiError = require("../utils/ApiError");
const approvalRequestRepository = require("../repositories/approval-request.repository");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const documentRepository = require("../repositories/document.repository");
const bankDetailsRepository = require("../repositories/bank-details.repository");
const providerServiceRepository = require("../repositories/provider-service.repository");
const documentService = require("./document.service");
const logger = require("./logger.service");

class AdminService {
  ensureApprovalRequestPending(approvalRequest) {
    if (approvalRequest.status !== "pending") {
      throw new ApiError(400, "Approval request is not pending.");
    }
  }

  async getPendingApprovals(limit = 50, skip = 0) {
    const [items, total] = await Promise.all([
      approvalRequestRepository.findPendingRequests(limit, skip),
      approvalRequestRepository.countPendingRequests(),
    ]);

    return { items, total, limit, skip };
  }

  async getApprovalDetails(approvalRequestId) {
    const approvalRequest = await approvalRequestRepository.findById(approvalRequestId);
    if (!approvalRequest) {
      throw new ApiError(404, "Approval request not found");
    }

    const [profile, documents, bankDetails, services] = await Promise.all([
      providerProfileRepository.findById(approvalRequest.providerId),
      documentRepository.findLatestByProviderId(approvalRequest.providerId),
      bankDetailsRepository.findByProviderId(approvalRequest.providerId),
      providerServiceRepository.findByProviderId(approvalRequest.providerId),
    ]);

    return {
      approvalRequest,
      profile,
      documents,
      bankDetails,
      services,
    };
  }

  async approveProvider(approvalRequestId, reviewedBy, feedback = "") {
    const approvalRequest = await approvalRequestRepository.findById(approvalRequestId);
    if (!approvalRequest) {
      throw new ApiError(404, "Approval request not found");
    }
    this.ensureApprovalRequestPending(approvalRequest);

    const profile = await providerProfileRepository.findById(approvalRequest.providerId);
    if (!profile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const documents = await documentRepository.findLatestByProviderId(approvalRequest.providerId);
    const requiredTypes = ["aadhar", "pan", "profile_photo"];
    const missingTypes = requiredTypes.filter(
      (type) => !documents.some((document) => document.documentType === type)
    );

    if (missingTypes.length > 0) {
      throw new ApiError(
        400,
        `Required documents are missing: ${missingTypes.join(", ")}`
      );
    }

    const unapprovedTypes = requiredTypes.filter(
      (type) =>
        !documents.some(
          (document) => document.documentType === type && document.status === "approved"
        )
    );

    if (unapprovedTypes.length > 0) {
      throw new ApiError(
        400,
        `Required documents must be approved before provider approval: ${unapprovedTypes.join(", ")}`
      );
    }

    const bankDetails = await bankDetailsRepository.findByProviderId(approvalRequest.providerId);
    if (!bankDetails) {
      throw new ApiError(400, "Bank details are required before provider approval.");
    }

    await approvalRequestRepository.update(approvalRequestId, {
      status: "approved",
      feedback,
      reviewedAt: new Date(),
      reviewedBy,
    });

    await providerProfileRepository.updateVerificationStatus(
      profile.userId,
      "approved",
      reviewedBy
    );

    logger.info("PROVIDER_APPROVED", {
      approvalRequestId,
      reviewedBy,
      providerId: profile._id,
    });

    return {
      message: "Provider approved successfully",
      approvalRequest: await approvalRequestRepository.findById(approvalRequestId),
    };
  }

  async rejectProvider(approvalRequestId, reviewedBy, rejectionReason) {
    const approvalRequest = await approvalRequestRepository.findById(approvalRequestId);
    if (!approvalRequest) {
      throw new ApiError(404, "Approval request not found");
    }
    this.ensureApprovalRequestPending(approvalRequest);

    const profile = await providerProfileRepository.findById(approvalRequest.providerId);
    if (!profile) {
      throw new ApiError(404, "Provider profile not found");
    }

    await approvalRequestRepository.update(approvalRequestId, {
      status: "rejected",
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy,
    });

    await providerProfileRepository.updateVerificationStatus(
      profile.userId,
      "rejected",
      reviewedBy
    );

    logger.info("PROVIDER_REJECTED", {
      approvalRequestId,
      reviewedBy,
      providerId: profile._id,
    });

    return {
      message: "Provider rejected successfully",
      approvalRequest: await approvalRequestRepository.findById(approvalRequestId),
    };
  }

  async verifyDocument(documentId, reviewedBy, isApproved) {
    return documentService.verifyDocument(documentId, isApproved, reviewedBy);
  }
}

module.exports = new AdminService();
