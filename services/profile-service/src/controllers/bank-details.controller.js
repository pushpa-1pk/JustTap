const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const bankDetailsService = require("../services/bank-details.service");
const providerProfileRepository = require("../repositories/provider-profile.repository");
const { addBankDetails, updateBankDetails } = require("../validators/bank-details.validator");

class BankDetailsController {
  addBankDetails = asyncHandler(async (req, res) => {
    const { error, value } = addBankDetails.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const result = await bankDetailsService.addBankDetails(providerProfile._id.toString(), value);
    res.status(201).json(new ApiResponse(201, result.message, result.data));
  });

  getBankDetails = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const bankDetails = await bankDetailsService.getBankDetails(providerProfile._id.toString());
    res.status(200).json(new ApiResponse(200, "Bank details retrieved successfully", bankDetails));
  });

  updateBankDetails = asyncHandler(async (req, res) => {
    const { error, value } = updateBankDetails.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const result = await bankDetailsService.updateBankDetails(providerProfile._id.toString(), value);
    res.status(200).json(new ApiResponse(200, result.message, result.data));
  });

  deleteBankDetails = asyncHandler(async (req, res) => {
    const providerProfile = await providerProfileRepository.findByUserId(req.user.id);
    if (!providerProfile) {
      throw new ApiError(404, "Provider profile not found");
    }

    const result = await bankDetailsService.deleteBankDetails(providerProfile._id.toString());
    res.status(200).json(new ApiResponse(200, result.message));
  });
}

module.exports = new BankDetailsController();
