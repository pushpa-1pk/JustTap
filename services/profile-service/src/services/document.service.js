const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const documentRepository = require("../repositories/document.repository");
const logger = require("./logger.service");
const uploadStorageService = require("./upload-storage.service");

const REQUIRED_DOCUMENT_TYPES = ["aadhar", "pan", "profile_photo"];

class DocumentService {
  async uploadDocument(providerId, data) {
    const existing = await documentRepository.findByProviderIdAndType(
      providerId,
      data.documentType
    );

    let version = 1;
    if (existing) {
      version = existing.version + 1;
      await documentRepository.markOldVersions(providerId, data.documentType);
    }

    const document = await documentRepository.create({
      providerId,
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      storageProvider: data.storageProvider || null,
      storageKey: data.storageKey || null,
      mimeType: data.mimeType || null,
      originalName: data.originalName || null,
      sizeBytes: data.sizeBytes || null,
      version,
      isLatest: true,
      status: "pending",
      uploadedAt: new Date(),
      verifiedAt: null,
      rejectionReason: "",
    });

    if (data.storageProvider === "local") {
      document.fileUrl = `${env.PUBLIC_BASE_URL}/api/v1/documents/${document._id}/file`;
      await document.save();
    }

    logger.info("PROVIDER_DOCUMENT_UPLOADED", {
      providerId,
      documentId: document._id,
      documentType: data.documentType,
    });

    return document;
  }

  async getProviderDocuments(providerId) {
    return documentRepository.findLatestByProviderId(providerId);
  }

  async getDocumentStatus(providerId) {
    const documents = await documentRepository.findLatestByProviderId(providerId);
    const submittedTypes = new Set(documents.map((item) => item.documentType));

    return {
      requiredDocuments: REQUIRED_DOCUMENT_TYPES,
      submittedDocuments: Array.from(submittedTypes),
      missingDocuments: REQUIRED_DOCUMENT_TYPES.filter((type) => !submittedTypes.has(type)),
      documents,
      isComplete: REQUIRED_DOCUMENT_TYPES.every((type) => submittedTypes.has(type)),
    };
  }

  async deleteDocument(documentId, providerId) {
    const existing = await documentRepository.findById(documentId);
    if (!existing || existing.providerId !== providerId) {
      throw new ApiError(404, "Document not found");
    }

    const result = await documentRepository.deleteOwned(documentId, providerId);

    if (!result.deletedCount) {
      throw new ApiError(404, "Document not found");
    }

    await uploadStorageService.deleteAsset(existing);

    logger.info("PROVIDER_DOCUMENT_DELETED", {
      providerId,
      documentId,
    });

    return { message: "Document deleted successfully" };
  }

  async getDocumentById(documentId) {
    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    return document;
  }

  async getDocumentFileAccess(documentId, requester) {
    const document = await this.getDocumentById(documentId);

    const isAdmin = requester.role === "admin";
    const isOwner = requester.role === "provider" && document.providerId === requester.providerId;

    if (!isAdmin && !isOwner) {
      throw new ApiError(403, "You do not have permission to access this document.");
    }

    if (document.storageProvider === "local") {
      return {
        mode: "local",
        document,
        filePath: uploadStorageService.getLocalFilePath(document.storageKey),
      };
    }

    return {
      mode: "redirect",
      document,
      redirectUrl: document.fileUrl,
    };
  }

  async verifyDocument(documentId, isApproved, reviewedBy, rejectionReason = null) {
    const status = isApproved ? "approved" : "rejected";
    const document = await documentRepository.updateStatus(documentId, status, reviewedBy, rejectionReason);

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    logger.info("PROVIDER_DOCUMENT_VERIFIED", {
      documentId,
      reviewedBy,
      status,
    });

    return {
      message: `Document ${status} successfully`,
      document,
    };
  }
}

module.exports = new DocumentService();
