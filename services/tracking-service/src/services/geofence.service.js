// Within src/services/geofence.service.js
const cacheService = require('./cache.service');
const stateMachineService = require('./stateMachine.service');
const eventBusService = require('./eventBus.service');
const notificationPublisher = require('./notificationPublisher.service');
const config = require('../config/env');
const { GEOFENCE_STATES, STREAM_EVENTS } = require('../constants/tracking.constants');

const { redisClient } = require('../config/redis');
const { geofenceStateLock } = require('../constants/redisKeys');
const { SOCKET_EVENTS } = require('../constants/tracking.constants');
const logger = require('../config/logger');

class GeofenceService {
  /**
   * @param {Object} bookingClient Core HTTP gateway mesh client to fetch customer static locations
   */
  constructor(bookingClient) {
    this.bookingClient = bookingClient;
    this.EARTH_RADIUS_METERS = 6371000;
    
    // Configurable standard multi-tiered structural threshold distances
    this.THRESHOLDS = Object.freeze({
      NEARBY: 500,
      ARRIVED: 100
    });
    
    // 24-hour expiration safety mapping window to ensure cleanup of lock allocations
    this.LOCK_TTL_SECONDS = 86400; 
  }

  /**
   * Processes validated real-time provider coordinates against targeted static customer coordinates
   */
   async evaluateMovementProximity(providerId, validatedDto, namespaceInstance) {
    const { bookingId, latitude, longitude } = validatedDto;

    // 1. Fetch static landing configurations locally from memory cache without making HTTP network calls
    const snapshot = await cacheService.getBookingSnapshot(bookingId);
    if (!snapshot) return;

    // 2. Compute the exact spherical distance matrix using the Haversine calculation loop
    const distanceMeters = this.calculateHaversineDistance(latitude, longitude, snapshot.latitude, snapshot.longitude);

    // 3. Determine the matching state transition targets based on configurable thresholds
    let proposedState = GEOFENCE_STATES.NONE;
    let eventType = null;

    if (distanceMeters <= config.geofenceArrivedMeters) {
      proposedState = GEOFENCE_STATES.ARRIVED;
      eventType = STREAM_EVENTS.TRACKING_ARRIVED;
    } else if (distanceMeters <= config.geofenceNearbyMeters) {
      proposedState = GEOFENCE_STATES.NEARBY;
      eventType = STREAM_EVENTS.TRACKING_NEARBY;
    }

    // 4. Validate forward-only progression criteria against our state machine
    if (eventType && stateMachineService.isValidTransition(snapshot.currentState, proposedState)) {
      // Update memory cache metrics immediately to prevent duplicate state fires
      await cacheService.updateCachedState(bookingId, proposedState);

      // 5. Emit a fire-and-forget event message to the distributed streams log
      await eventBusService.publish(eventType, {
        bookingId,
        providerId,
        distanceMeters: Math.round(distanceMeters),
        currentState: proposedState
      });

      if (eventType === STREAM_EVENTS.TRACKING_ARRIVED) {
        const booking = await this.bookingClient.getBookingById(bookingId);
        if (booking?.customerId) {
          await notificationPublisher.publishArrival({
            bookingId,
            customerId: booking.customerId,
            providerId: booking.providerId || providerId,
            providerName: booking.providerSnapshot?.businessName || null,
            providerSnapshot: booking.providerSnapshot || null,
            distanceMeters: Math.round(distanceMeters)
          });
        }
      }
    }
  }

  /**
   * Atomically asserts state lock execution changes before broadcasting downstream alerts
   */
  async handleThresholdBreach(bookingId, phase, currentDistance, namespaceInstance) {
    const lockKey = geofenceStateLock(bookingId, phase.toLowerCase());

    try {
      // Critical Bug Fix 4: Atomic distributed condition verification trap using native Redis SETNX
      const isLockAcquired = await redisClient.set(lockKey, 'true', {
        NX: true,
        EX: this.LOCK_TTL_SECONDS
      });

      // If the atomic lock returns null/false, the specific tier event has already fired once. Ignore.
      if (!isLockAcquired) {
        return;
      }

      logger.info(`Geofence boundary tier breach validated and locked successfully: [${phase}]`, {
        bookingId, currentDistanceMeters: Math.round(currentDistance)
      });

      // 1. Emit spatial notification coordinates over the local network room connection channels
      namespaceInstance.to(`room:booking:${bookingId}`).emit(SOCKET_EVENTS.OUTBOUND.PROVIDER_ARRIVED, {
        bookingId,
        phase,
        distanceMeters: Math.round(currentDistance),
        timestamp: new Date().toISOString()
      });

      // 2. Dispatch a command state update to sync with the database via the core HTTP cluster API gateway
      if (phase === 'ARRIVED') {
        await this.bookingClient.updateBookingWorkflowState(bookingId, 'ARRIVED');
      }

    } catch (error) {
      logger.error(`Failed to complete geofence action routing routines for state [${phase}]:`, {
        bookingId, error: error.message
      });
    }
  }

  /**
   * Pure mathematical calculation engine execution loop
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    
    const radLat1 = lat1 * Math.PI / 180;
    const radLat2 = lat2 * Math.PI / 180;

    const chordLengthSq = 
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
      
    const angularDist = 2 * Math.atan2(Math.sqrt(chordLengthSq), Math.sqrt(1 - chordLengthSq));
    
    return this.EARTH_RADIUS_METERS * angularDist;
  }
}

module.exports = GeofenceService;
