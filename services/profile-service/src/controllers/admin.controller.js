const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const adminService = require("../services/admin.service");

class AdminController {
  getPendingApprovals = asyncHandler(async (req, res) => {
    const { limit = 50, skip = 0 } = req.query;
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedSkip = Number.parseInt(skip, 10);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new ApiError(400, "limit must be an integer between 1 and 100");
    }

    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      throw new ApiError(400, "skip must be a non-negative integer");
    }

    const approvals = await adminService.getPendingApprovals(parsedLimit, parsedSkip);
    res.status(200).json(new ApiResponse(200, "Pending approvals retrieved successfully", approvals));
  });

  getApprovalDetails = asyncHandler(async (req, res) => {
    const details = await adminService.getApprovalDetails(req.params.approvalRequestId);
    res.status(200).json(new ApiResponse(200, "Approval details retrieved successfully", details));
  });

  approveProvider = asyncHandler(async (req, res) => {
    const { feedback = "" } = req.body;
    const result = await adminService.approveProvider(req.params.approvalRequestId, req.user.id, feedback);
    res.status(200).json(new ApiResponse(200, result.message, result.approvalRequest));
  });

  rejectProvider = asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      throw new ApiError(400, "Rejection reason is required");
    }
    const result = await adminService.rejectProvider(req.params.approvalRequestId, req.user.id, rejectionReason);
    res.status(200).json(new ApiResponse(200, result.message, result.approvalRequest));
  });

  verifyDocument = asyncHandler(async (req, res) => {
    const { isApproved, rejectionReason } = req.body;
    if (typeof isApproved !== "boolean") {
      throw new ApiError(400, "isApproved must be a boolean");
    }
    if (isApproved === false && !rejectionReason) {
      throw new ApiError(400, "rejectionReason is required when rejecting a document");
    }
    const result = await adminService.verifyDocument(
      req.params.documentId,
      req.user.id,
      isApproved,
      rejectionReason || null
    );
    res.status(200).json(new ApiResponse(200, result.message, result.document));
  });
}

module.exports = new AdminController();
