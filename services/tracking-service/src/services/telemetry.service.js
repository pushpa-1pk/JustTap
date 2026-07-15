const logger = require('../config/logger');
const { redisClient } = require('../config/redis');
const presenceService = require('./presence.service');

class TelemetryService {
  constructor(locationRepository, bookingClient) {
    this.locationRepository = locationRepository;
    this.bookingClient = bookingClient;
    
    // Enterprise Boundary Limits
    this.MAX_VELOCITY_KMH = 150;
    this.EARTH_RADIUS_KM = 6371;
  }

  /**
   * Main business logic processing loop for streaming, high-frequency coordinate frames
   */
  async processProviderIncomingTelemetry(providerId, validatedDto, namespaceInstance) {
    const startMark = Date.now();
    const { bookingId, latitude, longitude, accuracy, timestamp } = validatedDto;

    // 1. Core State Boundary Enforcement Check
    const isAuthorized = await this.bookingClient.verifyTrackingAccess(bookingId, providerId, 'PROVIDER');
    if (!isAuthorized) {
      logger.warn(`Telemetry Packet Dropped: Provider ${providerId} lacks active tracking rights for booking ${bookingId}`);
      return false;
    }

    // 2. Extract the historical location trace out of memory to run velocity and tracking analysis
    const historicalTrace = await this.locationRepository.getLatestLocation(providerId);

    if (historicalTrace) {
      // 3. Chronological Replay Attack Mitigation Protection
      if (new Date(timestamp) <= new Date(historicalTrace.timestamp)) {
        logger.warn(`Telemetry Packet Discarded: Stale timestamp detected for provider ${providerId}`);
        return false;
      }

      // 4. Critical Bug Fix: Enforce a Velocity Delta Cap to block location spoofing attacks
      const hoursElapsedTime = (new Date(timestamp) - new Date(historicalTrace.timestamp)) / (1000 * 60 * 60);
      if (hoursElapsedTime > 0) {
        const deltaDistanceKm = this.calculateDistanceKm(
          historicalTrace.latitude, historicalTrace.longitude,
          latitude, longitude
        );
        const calculatedVelocityKmh = deltaDistanceKm / hoursElapsedTime;

        if (calculatedVelocityKmh > this.MAX_VELOCITY_KMH) {
          logger.error(`Security Warning: Telemetry frame dropped due to extreme velocity reading (${calculatedVelocityKmh.toFixed(1)} km/h)`, {
            providerId, bookingId, deltaDistanceKm, hoursElapsedTime
          });
          return false;
        }
      }
    }

    // 5. Commit structured telemetry frame entries to hot memory caches
    await this.locationRepository.saveLatestLocation(providerId, validatedDto);

    // 6. Broadcast sanitized trajectory metrics out across room lanes
    namespaceInstance.to(`room:booking:${bookingId}`).emit('telemetry:stream', {
      providerId,
      latitude,
      longitude,
      speed: validatedDto.speed,
      heading: validatedDto.heading,
      timestamp
    });

    logger.info('Sanitized provider coordinate tracking package successfully routed downstream.', {
      providerId,
      bookingId,
      latitude,
      longitude,
      accuracy,
      timestamp,
      processingTimeMs: Date.now() - startMark
    });

    return true;
  }

  async registerProviderHeartbeat(providerId, bookingId) {
    await presenceService.recordHeartbeat(providerId, bookingId);
  }

  async processValidatedTrajectory(providerId, validatedDto, namespaceInstance) {
    const isProcessed = await this.processProviderIncomingTelemetry(
      providerId,
      validatedDto,
      namespaceInstance
    );

    if (!isProcessed) {
      return false;
    }

    await redisClient.rPush(
      `tracking:booking:${validatedDto.bookingId}:raw-trail`,
      JSON.stringify({
        providerId,
        latitude: validatedDto.latitude,
        longitude: validatedDto.longitude,
        accuracy: validatedDto.accuracy,
        speed: validatedDto.speed,
        heading: validatedDto.heading,
        timestamp: new Date(validatedDto.timestamp).toISOString()
      })
    );
    await redisClient.expire(`tracking:booking:${validatedDto.bookingId}:raw-trail`, 86400);

    return true;
  }

  /**
   * Helper method to compute distance deltas using a standard Haversine formula
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }
}

module.exports = TelemetryService;
