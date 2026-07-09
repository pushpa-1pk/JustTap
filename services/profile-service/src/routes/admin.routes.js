const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { adminRateLimiter } = require("../middlewares/rate-limit.middleware");
const adminController = require("../controllers/admin.controller");

router.use(adminRateLimiter, verifyToken, verifyRole(["admin"]));

router.get("/pending-approvals", adminController.getPendingApprovals);
router.get("/approvals/:approvalRequestId", adminController.getApprovalDetails);
router.post("/approvals/:approvalRequestId/approve", adminController.approveProvider);
router.post("/approvals/:approvalRequestId/reject", adminController.rejectProvider);
router.post("/documents/:documentId/verify", adminController.verifyDocument);

module.exports = router;
