const axios = require("axios");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");

class BookingClient {
  constructor() {
    this.client = axios.create({
      baseURL: env.services.bookingServiceUrl,
      timeout: 4000,
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": env.security.internalApiKey
      }
    });
  }

  async getBookingById(bookingId, correlationId) {
    try {
      const response = await this.client.get(`/api/v1/internal/bookings/${bookingId}`, {
        headers: {
          "x-correlation-id": correlationId
        }
      });

      return response.data?.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new ApiError(404, "Booking not found.");
      }

      throw new ApiError(502, "Unable to retrieve booking details from booking-service.");
    }
  }
}

module.exports = new BookingClient();
