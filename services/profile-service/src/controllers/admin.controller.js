const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const adminService = require("../services/admin.service");

class AdminController {
  getPendingApprovals = asyncHandler(async (req, res) => {
    const { limit = 50, skip = 0 } = req.query;
    const approvals = await adminService.getPendingApprovals(parseInt(limit), parseInt(skip));
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
    const { isApproved } = req.body;
    if (typeof isApproved !== "boolean") {
      throw new ApiError(400, "isApproved must be a boolean");
    }
    const result = await adminService.verifyDocument(req.params.documentId, req.user.id, isApproved);
    res.status(200).json(new ApiResponse(200, result.message, result.document));
  });
}

module.exports = new AdminController();
