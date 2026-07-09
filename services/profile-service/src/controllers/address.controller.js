const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const addressService = require("../services/address.service");
const addressValidator = require("../validators/address.validator");

class AddressController {
  createAddress = asyncHandler(async (req, res) => {
    const { error, value } = addressValidator.createAddress.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const address = await addressService.createAddress(req.user.id, value);
    res.status(201).json(new ApiResponse(201, "Address created successfully", address));
  });

  getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await addressService.getUserAddresses(req.user.id);
    res.status(200).json(new ApiResponse(200, "Addresses retrieved successfully", addresses));
  });

  getAddress = asyncHandler(async (req, res) => {
    const address = await addressService.getAddress(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, "Address retrieved successfully", address));
  });

  updateAddress = asyncHandler(async (req, res) => {
    const { error, value } = addressValidator.updateAddress.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const address = await addressService.updateAddress(req.params.id, req.user.id, value);
    res.status(200).json(new ApiResponse(200, "Address updated successfully", address));
  });

  setPrimaryAddress = asyncHandler(async (req, res) => {
    const address = await addressService.setPrimaryAddress(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, "Primary address updated successfully", address));
  });

  deleteAddress = asyncHandler(async (req, res) => {
    const result = await addressService.deleteAddress(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, result.message));
  });
}

module.exports = new AddressController();
