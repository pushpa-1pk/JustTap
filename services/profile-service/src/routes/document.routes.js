const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { providerRateLimiter, adminRateLimiter } = require("../middlewares/rate-limit.middleware");
const { providerDocumentUpload } = require("../middlewares/upload.middleware");
const documentController = require("../controllers/document.controller");

router.use(verifyToken);
router.get("/:id/file", (req, res, next) => {
  const limiter = req.user?.role === "admin" ? adminRateLimiter : providerRateLimiter;
  return limiter(req, res, next);
}, verifyRole(["provider", "admin"]), documentController.getDocumentFile);
router.post("/upload", providerRateLimiter, verifyRole(["provider"]), providerDocumentUpload, documentController.uploadDocument);
router.get("/", providerRateLimiter, verifyRole(["provider"]), documentController.getDocuments);
router.get("/status", providerRateLimiter, verifyRole(["provider"]), documentController.getDocumentStatus);
router.delete("/:id", providerRateLimiter, verifyRole(["provider"]), documentController.deleteDocument);

module.exports = router;
