const axios = require("axios");
const http = require("http");
const https = require("https");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");

class BookingServiceClient {
  constructor() {
    this.client = axios.create({
      baseURL: env.BOOKING_SERVICE_URL,
      timeout: env.CLIENT_TIMEOUT_MS,
      httpAgent: new http.Agent({
        keepAlive: true,
        maxSockets: env.CLIENT_MAX_SOCKETS,
        keepAliveMsecs: env.MAX_HTTP_KEEP_ALIVE_MSEC,
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: env.CLIENT_MAX_SOCKETS,
        keepAliveMsecs: env.MAX_HTTP_KEEP_ALIVE_MSEC,
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": env.INTERNAL_API_KEY,
      },
    });
  }

  async getBooking(bookingId, requestId = "internal") {
    try {
      const response = await this.client.get(`/api/v1/internal/bookings/${bookingId}`, {
        headers: { "X-Request-Id": requestId },
      });

      return response.data?.data || null;
    } catch (error) {
      throw new ApiError("Unable to fetch booking details.", 502);
    }
  }

  async startMatchingRequest(bookingId, payload, requestId = "internal") {
    try {
      const response = await this.client.patch(
        `/api/v1/internal/bookings/${bookingId}/matching/request`,
        payload,
        { headers: { "X-Request-Id": requestId } }
      );

      return response.data?.data || null;
    } catch (error) {
      throw new ApiError("Unable to move booking into pending provider response.", 502);
    }
  }

  async acceptMatchingRequest(bookingId, providerId, requestId = "internal") {
    try {
      const response = await this.client.patch(
        `/api/v1/internal/bookings/${bookingId}/matching/accept`,
        { providerId },
        { headers: { "X-Request-Id": requestId } }
      );

      return response.data?.data || null;
    } catch (error) {
      throw new ApiError("Unable to accept booking request.", 502);
    }
  }

  async rejectOrTimeoutMatchingRequest(
    bookingId,
    payload,
    requestId = "internal"
  ) {
    try {
      const response = await this.client.patch(
        `/api/v1/internal/bookings/${bookingId}/matching/reject`,
        payload,
        { headers: { "X-Request-Id": requestId } }
      );

      return response.data?.data || null;
    } catch (error) {
      throw new ApiError("Unable to reject or timeout booking request.", 502);
    }
  }
}

module.exports = BookingServiceClient;
