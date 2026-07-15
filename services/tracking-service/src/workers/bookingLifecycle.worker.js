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
      await redisClient.xCreateConsumerGroup(this.streamName, this.consumerGroup, '$', {
        MKSTREAM: true
      });
      logger.info(`Redis Stream Consumer Group initialized successfully: [${this.consumerGroup}]`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        logger.debug(`Consumer group [${this.consumerGroup}] already exists. Reusing active structure.`);
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
    const { eventType, bookingId, metadata } = eventPayload;
    
    try {
      const parsedMetadata = JSON.parse(metadata || '{}');
      logger.info(`Background worker routing operational tracking events: [${eventType}] for booking ${bookingId}`);

      switch (eventType) {
        
        // Target: Cache static destination coordinates dynamically as soon as a booking shifts to active
        case STREAM_EVENTS.LIFECYCLE_ACCEPTED:
          if (parsedMetadata.latitude && parsedMetadata.longitude) {
            await cacheService.cacheBookingSnapshot(bookingId, {
              latitude: parsedMetadata.latitude,
              longitude: parsedMetadata.longitude,
              providerId: parsedMetadata.providerId
            });
            logger.info(`Successfully completed tracking cache pre-warming operations for booking: ${bookingId}`);
          }
          break;

        // Fixed Bug 2: Clear geofencing locks and cache files immediately upon cancellation, completion, or reassignment signals
        case STREAM_EVENTS.LIFECYCLE_CLEANUP:
          await cacheService.clearBookingResources(bookingId);
          logger.info(`Successfully executed clean extraction teardown of transient resources for booking: ${bookingId}`);
          break;
        
        case 'booking:lifecycle:completed':
            // 1. Fetch the raw, uncompressed trace records stored in the memory-hot Redis cache list
            const cacheListKey = `tracking:booking:${bookingId}:raw-trail`;
            const stringifiedPoints = await redisClient.lRange(cacheListKey, 0, -1);
            
            if (stringifiedPoints.length > 0) {
                const arrayPoints = stringifiedPoints.map(p => JSON.parse(p));
                
                // 2. Offload the compression and MongoDB persistence work out-of-line to a background thread pass
                await pathHistoryRepository.persistCompressedTrail(
                bookingId,
                parsedMetadata.providerId,
                arrayPoints,
                parsedMetadata.totalDistanceMeters || 0
                );
            }

        default:
          logger.debug(`Ignored generic event signature match index footprint: [${eventType}]`);
          break;
      }

      // Acknowledge the message to clear it from the Pending Entries List (PEL)
      await redisClient.xAck(this.streamName, this.consumerGroup, messageId);

    } catch (error) {
      logger.error(`Failed to process log entry footprint safely on message item reference id [${messageId}]:`, {
        bookingId, eventType, error: error.message
      });
      // In production, un-acknowledged messages bubble up to inspection logs or retry retry patterns automatically
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