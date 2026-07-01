const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const documentService = require("../services/document.service");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const { uploadDocument } = require("../validators/document.validator");

class DocumentController {
  uploadDocument = asyncHandler(async (req, res) => {
    const { error, value } = uploadDocument.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const document = await documentService.uploadDocument(providerProfile._id, value);
    res.status(201).json(new ApiResponse(201, "Document uploaded successfully", document));
  });

  getDocuments = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const documents = await documentService.getProviderDocuments(providerProfile._id);
    res.status(200).json(new ApiResponse(200, "Documents retrieved successfully", documents));
  });

  getDocumentStatus = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const status = await documentService.getDocumentStatus(providerProfile._id);
    res.status(200).json(new ApiResponse(200, "Document status retrieved successfully", status));
  });

  deleteDocument = asyncHandler(async (req, res) => {
    const result = await documentService.deleteDocument(req.params.id);
    res.status(200).json(new ApiResponse(200, result.message));
  });
}

module.exports = new DocumentController();
