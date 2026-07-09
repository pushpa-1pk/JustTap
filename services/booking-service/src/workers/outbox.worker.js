const BookingEventRepository = require('../repositories/booking-event.repository');
const eventQueue = require('../queues/event.queue');
const logger = require('../utils/logger');

class OutboxWorker {
  constructor() {
    this.eventRepo = new BookingEventRepository();
    this.maxRetryThreshold = 5;
    this.concurrencyLimit = 10; // Strict protection barrier for Redis connection pool
  }

  /**
   * Processes outbox events using a concurrency-limited pool loop
   */
  async processPendingEvents(batchSize = 50) {
    const pendingBatch = await this.eventRepo.fetchUnpublishedBatch(batchSize);
    if (!pendingBatch || pendingBatch.length === 0) return 0;

    let processedCount = 0;
    
    // Controlled chunking pool loop execution to avoid slamming Redis or connection blocks
    for (let i = 0; i < pendingBatch.length; i += this.concurrencyLimit) {
      const chunk = pendingBatch.slice(i, i + this.concurrencyLimit);
      
      await Promise.all(chunk.map(async (event) => {
        try {
          await eventQueue.enqueue(event.eventType, event.payload);
          await this.eventRepo.markAsPublished(event._id);
          processedCount++;
        } catch (error) {
          logger.error({
            message: 'Outbox publication attempt failed.',
            job: 'OutboxWorker',
            eventId: event._id,
            error: error.message
          });

          // Move the event to the Dead Letter Queue (DLQ) if it exceeds the retry limit
          if (event.retryCount + 1 >= this.maxRetryThreshold) {
            await this.eventRepo.model.findByIdAndUpdate(event._id, {
              $set: { 
                published: false,
                isDeadLetter: true,
                dlqReason: `Exceeded max retry threshold of ${this.maxRetryThreshold}. Error: ${error.message}`
              }
            });
            logger.warn({ message: 'Event moved to Dead Letter Queue (DLQ).', job: 'OutboxWorker', eventId: event._id });
          } else {
            await this.eventRepo.incrementRetry(event._id, this.maxRetryThreshold);
          }
        }
      }));
    }

    return processedCount;
  }
}

module.exports = OutboxWorker;