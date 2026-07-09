const express = require("express");
const { verifyToken } = require("../middlewares/auth.middleware");
const internalController = require("../controllers/internal.controller");

const router = express.Router();

router.get("/providers/:userId", verifyToken, internalController.getProviderByUserId);

module.exports = router;
