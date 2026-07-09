const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const providerProfileService = require("../services/provider-profile.service");
const uploadStorageService = require("../services/upload-storage.service");
const {
  createProviderProfile,
  updateProviderProfile,
  updateProviderLocation,
  updateProviderOnlineStatus,
} = require("../validators/provider-profile.validator");

class ProviderProfileController {
  createProfile = asyncHandler(async (req, res) => {
    const { error, value } = createProviderProfile.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const payload = { ...value };

    if (req.file) {
      const uploadedFile = await uploadStorageService.storeFile({
        file: req.file,
        folder: "profile-images/providers",
      });
      payload.profileImage = uploadedFile.url;
      payload.profileImageStorageProvider = uploadedFile.storageProvider;
      payload.profileImageStorageKey = uploadedFile.storageKey;
    }

    const profile = await providerProfileService.createProfile(req.user.id, payload);
    res.status(201).json(new ApiResponse(201, "Provider profile created successfully", profile));
  });

  getProfile = asyncHandler(async (req, res) => {
    const profile = await providerProfileService.getProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, "Provider profile retrieved successfully", profile));
  });

  updateProfile = asyncHandler(async (req, res) => {
    const { error, value } = updateProviderProfile.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const existingProfile = await providerProfileService.getProfile(req.user.id);
    const payload = { ...value };

    if (req.file) {
      const uploadedFile = await uploadStorageService.storeFile({
        file: req.file,
        folder: "profile-images/providers",
      });
      payload.profileImage = uploadedFile.url;
      payload.profileImageStorageProvider = uploadedFile.storageProvider;
      payload.profileImageStorageKey = uploadedFile.storageKey;
    }

    const profile = await providerProfileService.updateProfile(req.user.id, payload);

    if (req.file) {
      await uploadStorageService.deleteAsset({
        storageProvider: existingProfile.profileImageStorageProvider,
        storageKey: existingProfile.profileImageStorageKey,
      });
    }

    res.status(200).json(new ApiResponse(200, "Provider profile updated successfully", profile));
  });

  updateLocation = asyncHandler(async (req, res) => {
    const { error, value } = updateProviderLocation.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const profile = await providerProfileService.updateLocation(
      req.user.id,
      value.latitude,
      value.longitude
    );
    res.status(200).json(new ApiResponse(200, "Provider location updated successfully", profile));
  });

  toggleOnlineStatus = asyncHandler(async (req, res) => {
    const { error, value } = updateProviderOnlineStatus.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const profile = await providerProfileService.toggleOnlineStatus(req.user.id, value.isOnline);
    res.status(200).json(new ApiResponse(200, "Provider online status updated successfully", profile));
  });

  requestApproval = asyncHandler(async (req, res) => {
    const approvalRequest = await providerProfileService.requestApproval(req.user.id);
    res.status(200).json(new ApiResponse(200, "Approval requested successfully", approvalRequest));
  });
}

module.exports = new ProviderProfileController();
