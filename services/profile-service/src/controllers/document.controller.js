const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const documentService = require("../services/document.service");
const uploadStorageService = require("../services/upload-storage.service");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const { uploadDocument } = require("../validators/document.validator");

class DocumentController {
  validateDocumentFileByType(file, documentType) {
    if (!file) {
      return;
    }

    const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const imageOnlyTypes = new Set(["profile_photo"]);

    if (imageOnlyTypes.has(documentType) && !imageMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, `${documentType} must be uploaded as an image file.`);
    }
  }

  uploadDocument = asyncHandler(async (req, res) => {
    const { error, value } = uploadDocument.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }
    if (!req.file && !value.fileUrl) {
      throw new ApiError(400, "Either document file or fileUrl is required");
    }
    if (value.fileUrl && !req.file && !env.ALLOW_REMOTE_FILE_URL_UPLOADS) {
      throw new ApiError(400, "Remote fileUrl uploads are disabled.");
    }
    this.validateDocumentFileByType(req.file, value.documentType);

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const payload = { ...value };

    if (req.file) {
      const uploadedFile = await uploadStorageService.storeFile({
        file: req.file,
        folder: `provider-documents/${providerProfile._id.toString()}`,
      });
      payload.fileUrl = uploadedFile.url;
      payload.storageProvider = uploadedFile.storageProvider;
      payload.storageKey = uploadedFile.storageKey;
      payload.mimeType = uploadedFile.mimeType;
      payload.originalName = uploadedFile.originalName;
      payload.sizeBytes = uploadedFile.sizeBytes;
    }

    const document = await documentService.uploadDocument(providerProfile._id.toString(), payload);
    res.status(201).json(new ApiResponse(201, "Document uploaded successfully", document));
  });

  getDocuments = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const documents = await documentService.getProviderDocuments(providerProfile._id.toString());
    res.status(200).json(new ApiResponse(200, "Documents retrieved successfully", documents));
  });

  getDocumentStatus = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const status = await documentService.getDocumentStatus(providerProfile._id.toString());
    res.status(200).json(new ApiResponse(200, "Document status retrieved successfully", status));
  });

  deleteDocument = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const result = await documentService.deleteDocument(
      req.params.id,
      providerProfile._id.toString()
    );
    res.status(200).json(new ApiResponse(200, result.message));
  });

  getDocumentFile = asyncHandler(async (req, res) => {
    const requester = {
      id: req.user.id,
      role: req.user.role,
      providerId: null,
    };

    if (req.user.role === "provider") {
      const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
      if (!providerProfile) {
        throw new ApiError(404, "Provider profile not found");
      }

      requester.providerId = providerProfile._id.toString();
    }

    const access = await documentService.getDocumentFileAccess(req.params.id, requester);

    if (access.mode === "redirect") {
      return res.redirect(access.redirectUrl);
    }

    return res.sendFile(access.filePath, {
      root: undefined,
      headers: {
        "Content-Type": access.document.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${access.document.originalName || "document"}"`,
      },
    });
  });
}

module.exports = new DocumentController();
