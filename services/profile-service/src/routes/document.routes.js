const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const documentController = require("../controllers/document.controller");

router.post("/upload", verifyToken, documentController.uploadDocument);
router.get("/", verifyToken, documentController.getDocuments);
router.get("/status", verifyToken, documentController.getDocumentStatus);
router.delete("/:id", verifyToken, documentController.deleteDocument);

module.exports = router;
