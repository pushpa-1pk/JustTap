const ApiError = require("../utils/ApiError");
const addressRepository = require("../repositories/address.repository");
const logger = require("./logger.service");

class AddressService {
  async createAddress(userId, data) {
    try {
      // If this is the first address or marked as primary, set as primary
      const existingAddresses = await addressRepository.findByUserId(userId);
      const isPrimary = data.isPrimary || existingAddresses.length === 0;

      if (isPrimary && existingAddresses.length > 0) {
        await addressRepository.updateMany({ userId }, { isPrimary: false });
      }

      const address = await addressRepository.create({
        userId,
        isPrimary,
        location: {
          type: "Point",
          coordinates: [data.longitude, data.latitude],
        },
        ...data,
      });

      logger.info("ADDRESS_CREATED", { userId, addressId: address._id });
      return address;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("CREATE_ADDRESS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to create address");
    }
  }

  async getAddress(addressId) {
    try {
      const address = await addressRepository.findById(addressId);
      if (!address) {
        throw new ApiError(404, "Address not found");
      }
      return address;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("GET_ADDRESS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to fetch address");
    }
  }

  async getUserAddresses(userId) {
    try {
      const addresses = await addressRepository.findByUserId(userId);
      return addresses;
    } catch (error) {
      logger.error("GET_USER_ADDRESSES_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to fetch addresses");
    }
  }

  async updateAddress(addressId, data) {
    try {
      const updateData = { ...data };
      if (data.latitude && data.longitude) {
        updateData.location = {
          type: "Point",
          coordinates: [data.longitude, data.latitude],
        };
      }

      const address = await addressRepository.update(addressId, updateData);
      if (!address) {
        throw new ApiError(404, "Address not found");
      }

      logger.info("ADDRESS_UPDATED", { addressId });
      return address;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("UPDATE_ADDRESS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to update address");
    }
  }

  async setPrimaryAddress(userId, addressId) {
    try {
      const address = await addressRepository.updatePrimary(userId, addressId);
      logger.info("PRIMARY_ADDRESS_SET", { userId, addressId });
      return address;
    } catch (error) {
      logger.error("SET_PRIMARY_ADDRESS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to set primary address");
    }
  }

  async deleteAddress(addressId) {
    try {
      await addressRepository.delete(addressId);
      logger.info("ADDRESS_DELETED", { addressId });
      return { message: "Address deleted successfully" };
    } catch (error) {
      logger.error("DELETE_ADDRESS_ERROR", { error: error.message });
      throw new ApiError(500, "Failed to delete address");
    }
  }
}

module.exports = new AddressService();
