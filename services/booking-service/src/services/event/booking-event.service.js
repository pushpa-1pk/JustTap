const BookingEventRepository = require('../../repositories/booking-event.repository');
const BookingRepository = require('../../repositories/booking.repository');

class BookingEventService {
  constructor() {
    this.eventRepo = new BookingEventRepository();
    this.bookingRepo = new BookingRepository();
  }

  /**
   * Enqueues a structured message event inside an active database session transaction block
   * @param {string} bookingId - Associated booking tracking document reference
   * @param {string} eventType - Uppercase token string classifying the event (e.g., BOOKING_CREATED)
   * @param {Object} payload - The complete data body payload needed by external consumers
   * @param {Object} [session=null] - Optional transaction workspace handle
   */
  async dispatchEvent(bookingId, eventType, payload, session = null) {
    const booking = await this._loadBookingContext(bookingId, session);
    const outboxPayload = {
      bookingId,
      eventType: eventType.toUpperCase(),
      payload: {
        bookingId,
        customerId: booking?.customerId ? String(booking.customerId) : null,
        customerPhone: booking?.customerSnapshot?.phone || null,
        providerId: payload?.providerId || (booking?.providerId ? String(booking.providerId) : null),
        providerName: payload?.providerName || booking?.providerSnapshot?.businessName || null,
        providerSnapshot: booking?.providerSnapshot || null,
        bookingNumber: payload?.bookingNumber || booking?.bookingNumber || null,
        ...payload,
        emittedAt: new Date()
      },
      published: false,
      retryCount: 0,
      publishedAt: null
    };

    return this.eventRepo.queueEvent(outboxPayload, session);
  }

  async _loadBookingContext(bookingId, session = null) {
    const query = this.bookingRepo.model.findOne({
      _id: bookingId,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }).lean();

    if (session) {
      query.session(session);
    }

    return query.exec();
  }
}

module.exports = BookingEventService;
