const axios = require('axios');
const config = require('../../config/env');
const logger = require('../../config/logger');

class BookingClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.bookingServiceUrl,
      timeout: 4000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': config.internalApiKey
      }
    });
  }

  async verifyTrackingAccess(bookingId, userId, role) {
    try {
      // Secure cluster validation handshake: verify active execution state machine states
      const response = await this.client.post(`/api/v1/internal/bookings/${bookingId}/verify-tracking`, {
        userId,
        role
      });
      
      return response.data?.success && response.data?.data?.isTrackingAllowed;
    } catch (error) {
      logger.error(`Cross-service verification handshake failure against booking cluster map node ID ${bookingId}:`, {
        message: error.message,
        userId,
        role
      });
      return false; // Fail-secure: refuse subscription access if internal connection metrics timeout
    }
  }

  async getBookingById(bookingId) {
    try {
      const response = await this.client.get(`/api/v1/internal/bookings/${bookingId}`);
      return response.data?.data || null;
    } catch (error) {
      logger.error(`Failed to load booking snapshot for tracking notification flow ${bookingId}:`, {
        message: error.message
      });
      return null;
    }
  }
}

module.exports = BookingClient;
