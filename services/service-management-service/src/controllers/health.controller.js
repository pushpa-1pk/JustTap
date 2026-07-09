const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const healthService = require("../services/health.service");

const live = asyncHandler(async (req, res) => {
  const payload = await healthService.getLiveness();
  return res.status(200).json(new ApiResponse(200, "Service is live", payload));
});

const ready = asyncHandler(async (req, res) => {
  const payload = await healthService.getReadiness();
  const statusCode = payload.status === "ready" ? 200 : 503;

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, "Service readiness status", payload));
});

module.exports = {
  live,
  ready,
};
