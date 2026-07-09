const BookingEventRepository = require('../../repositories/booking-event.repository');

class BookingEventService {
  constructor() {
    this.eventRepo = new BookingEventRepository();
  }

  /**
   * Enqueues a structured message event inside an active database session transaction block
   * @param {string} bookingId - Associated booking tracking document reference
   * @param {string} eventType - Uppercase token string classifying the event (e.g., BOOKING_CREATED)
   * @param {Object} payload - The complete data body payload needed by external consumers
   * @param {Object} [session=null] - Optional transaction workspace handle
   */
  async dispatchEvent(bookingId, eventType, payload, session = null) {
    const outboxPayload = {
      bookingId,
      eventType: eventType.toUpperCase(),
      payload: {
        ...payload,
        emittedAt: new Date()
      },
      published: false,
      retryCount: 0,
      publishedAt: null
    };

    return this.eventRepo.queueEvent(outboxPayload, session);
  }
}

module.exports = BookingEventService;
