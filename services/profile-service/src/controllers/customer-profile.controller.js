const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const customerProfileService = require("../services/customer-profile.service");
const uploadStorageService = require("../services/upload-storage.service");
const {
  createCustomerProfile,
  updateCustomerProfile,
} = require("../validators/customer-profile.validator");

class CustomerProfileController {
  createProfile = asyncHandler(async (req, res) => {
    const { error, value } = createCustomerProfile.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const payload = { ...value };

    if (req.file) {
      const uploadedFile = await uploadStorageService.storeFile({
        file: req.file,
        folder: "profile-images/customers",
      });
      payload.profileImage = uploadedFile.url;
      payload.profileImageStorageProvider = uploadedFile.storageProvider;
      payload.profileImageStorageKey = uploadedFile.storageKey;
    }

    const profile = await customerProfileService.createProfile(req.user.id, payload);
    res.status(201).json(new ApiResponse(201, "Customer profile created successfully", profile));
  });

  getProfile = asyncHandler(async (req, res) => {
    const profile = await customerProfileService.getProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, "Customer profile retrieved successfully", profile));
  });

  updateProfile = asyncHandler(async (req, res) => {
    const { error, value } = updateCustomerProfile.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const existingProfile = await customerProfileService.getProfile(req.user.id);
    const payload = { ...value };

    if (req.file) {
      const uploadedFile = await uploadStorageService.storeFile({
        file: req.file,
        folder: "profile-images/customers",
      });
      payload.profileImage = uploadedFile.url;
      payload.profileImageStorageProvider = uploadedFile.storageProvider;
      payload.profileImageStorageKey = uploadedFile.storageKey;
    }

    const profile = await customerProfileService.updateProfile(req.user.id, payload);

    if (req.file) {
      await uploadStorageService.deleteAsset({
        storageProvider: existingProfile.profileImageStorageProvider,
        storageKey: existingProfile.profileImageStorageKey,
      });
    }

    res.status(200).json(new ApiResponse(200, "Customer profile updated successfully", profile));
  });

  getProfileWithAddresses = asyncHandler(async (req, res) => {
    const profile = await customerProfileService.getProfileWithAddresses(req.user.id);
    res.status(200).json(new ApiResponse(200, "Customer profile retrieved successfully", profile));
  });
}

module.exports = new CustomerProfileController();
