const axios = require("axios");
const config = require("../config/env");
const logger = require("../config/logger");
const ApiError = require("../utils/apiError");

class BookingClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.services.bookingServiceUrl,
      timeout: config.services.internalRequestTimeoutMs,
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.security.internalApiKey,
      },
    });
  }

  async getBookingById(bookingId) {
    try {
      const response = await this.client.get(`/api/v1/internal/bookings/${bookingId}`);
      return response.data?.data || null;
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        throw new ApiError(404, "Booking not found for review eligibility.");
      }

      logger.error("Failed to load booking details for review eligibility.", {
        bookingId,
        message: error.message,
        status,
      });
      throw new ApiError(502, "Unable to verify booking eligibility at this time.");
    }
  }
}

module.exports = new BookingClient();
