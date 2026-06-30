const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const result = await authService.sendOtp(phone);

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP sent successfully", result));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully", result));
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Token refreshed successfully", result));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Authenticated user fetched successfully", user));
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout({
    userId: req.user._id,
    deviceId: req.body.deviceId,
    accessTokenJti: req.auth.jti,
    accessTokenExp: req.auth.exp,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Logged out successfully", result));
});

const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, "Logged out from all devices successfully", result)
  );
});

module.exports = {
  sendOtp,
  verifyOtp,
  refreshToken,
  getMe,
  logout,
  logoutAll,
};
