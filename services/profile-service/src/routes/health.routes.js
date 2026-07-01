const express = require("express");
const router = express.Router();
const ApiResponse = require("../utils/ApiResponse");

router.get("/", (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Profile Service Health Check", {
      service: "Profile Service",
      status: "running",
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = router;
