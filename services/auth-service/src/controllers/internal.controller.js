const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

const updateProfileStatus = asyncHandler(async (req, res) => {
  const result = await authService.setProfileCompleted(
    req.params.userId,
    req.body.profileCompleted
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile status updated successfully", result));
});

module.exports = {
  updateProfileStatus,
};
