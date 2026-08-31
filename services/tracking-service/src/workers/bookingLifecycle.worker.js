const { redisClient } = require('../config/redis');
const config = require('../config/env');
const logger = require('../config/logger');
const cacheService = require('../services/cache.service');
const { STREAM_EVENTS } = require('../constants/tracking.constants');
const pathHistoryRepository = require('../repositories/pathHistory.repository');

class BookingLifecycleWorker {
  constructor() {
    this.streamName = config.trackingStreamName;
    this.consumerGroup = config.bookingConsumerGroup;
    this.consumerName = `${config.serviceName}:worker:${process.pid}`;
    this.isRunning = false;
  }

  /**
   * Initializes consumer topology structures within the Redis engine keyspace
   */
  async initializeConsumerGroup() {
    try {
      // Create the group starting from '$' (only consume new messages appended after group boot)
      await redisClient.xGroupCreate(this.streamName, this.consumerGroup, '$', {
        MKSTREAM: true
      });
      logger.info(`Redis Stream Consumer Group initialized successfully: [${this.consumerGroup}]`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        logger.debug(`Consumer group [${this.consumerGroup}] already exists. Reusing active structure.`);
      } else if (config.env === 'development') {
        logger.warn(`Redis Streams (XGROUP) unsupported by current Redis instance (${error.message}). Deactivating stream worker loop in dev.`);
        this.isRunning = false;
        return;
      } else {
        logger.error('Critical failure initializing Redis Stream infrastructure configuration states:', error);
        throw error;
      }
    }
  }

  /**
   * Spins up the continuous background event consumption loop
   */
  async start() {
    this.isRunning = true;
    await this.initializeConsumerGroup();
    logger.info(`Booking Lifecycle Worker successfully started running under thread client name: ${this.consumerName}`);

    // Non-blocking background execution pump loop
    while (this.isRunning) {
      try {
        // Read outstanding events from the stream log using group contexts
        const response = await redisClient.xReadGroup(
          this.consumerGroup,
          this.consumerName,
          [{ key: this.streamName, id: '>' }], // '>' targets only messages that haven't been read yet
          { COUNT: 10, BLOCK: 5000 }
        );

        if (!response || response.length === 0) continue;

        for (const streamData of response) {
          const { messages } = streamData;
          for (const message of messages) {
            await this.processLifecycleEvent(message.id, message.message);
          }
        }
      } catch (error) {
        logger.error('Encountered an processing anomaly during background event processing iterations:', error);
        // Introduce artificial recovery delay to prevent aggressive high-frequency cycling during cluster anomalies
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Main routing engine execution gate for lifecycle event stream payloads
   */
  async processLifecycleEvent(messageId, eventPayload) {
    try {
      if (!eventPayload.data) {
        logger.warn(`Received empty payload or missing 'data' field on message ${messageId}`);
        await redisClient.xAck(this.streamName, this.consumerGroup, messageId);
        return;
      }

      const parsedEvent = JSON.parse(eventPayload.data);
      const eventType = parsedEvent.eventType;
      const rawPayload = parsedEvent.payload;
      const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : (rawPayload || {});
      const bookingId = payload.bookingId || payload.id;

      if (!eventType || !bookingId) {
        logger.warn(`Parsed event stream payload is missing eventType or bookingId: messageId=${messageId}`);
        await redisClient.xAck(this.streamName, this.consumerGroup, messageId);
        return;
      }

      logger.info(`Background worker routing operational tracking events: [${eventType}] for booking ${bookingId}`);

      switch (eventType) {
        case 'BOOKING_ACCEPTED':
          // Pre-warm tracking cache with customer coordinates
          if (payload.customerAddressSnapshot?.location?.coordinates) {
            const [longitude, latitude] = payload.customerAddressSnapshot.location.coordinates;
            await cacheService.cacheBookingSnapshot(bookingId, {
              latitude,
              longitude,
              providerId: payload.providerId || ''
            });
            logger.info(`Successfully completed tracking cache pre-warming operations for booking: ${bookingId}`);
          } else {
            logger.warn(`BOOKING_ACCEPTED payload missing customer location coordinates: bookingId=${bookingId}`);
          }
          break;

        case 'BOOKING_COMPLETED':
          // 1. Fetch raw trail from Redis cache list
          const cacheListKey = `tracking:booking:${bookingId}:raw-trail`;
          const stringifiedPoints = await redisClient.lRange(cacheListKey, 0, -1);
          
          if (stringifiedPoints.length > 0) {
            const arrayPoints = stringifiedPoints.map(p => JSON.parse(p));
            // 2. Persist compressed path history to MongoDB
            await pathHistoryRepository.persistCompressedTrail(
              bookingId,
              payload.providerId || '',
              arrayPoints,
              payload.totalDistanceMeters || 0
            );
            logger.info(`Successfully persisted compressed path history for booking: ${bookingId}`);
          }

          // 3. Clean up cache resources
          await cacheService.clearBookingResources(bookingId);
          logger.info(`Successfully executed clean extraction teardown of transient resources for booking: ${bookingId}`);
          break;

        case 'BOOKING_CANCELLED':
        case 'BOOKING_ALLOCATION_FAILED':
        case 'BOOKING_FAILED':
          await cacheService.clearBookingResources(bookingId);
          logger.info(`Successfully executed clean extraction teardown of transient resources for booking: ${bookingId}`);
          break;

        default:
          logger.debug(`Ignored generic event signature match index footprint: [${eventType}]`);
          break;
      }

      // Acknowledge the message to clear it from the Pending Entries List (PEL)
      await redisClient.xAck(this.streamName, this.consumerGroup, messageId);

    } catch (error) {
      logger.error(`Failed to process log entry footprint safely on message item reference id [${messageId}]:`, {
        error: error.message
      });
    }
  }

  

  /**
   * Graceful termination method to cycle down worker activities cleanly
   */
  async stop() {
    logger.warn('Commencing background lifecycle worker thread teardown routines...');
    this.isRunning = false;
  }
}

module.exports = new BookingLifecycleWorker();