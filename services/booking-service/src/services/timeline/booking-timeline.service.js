const BookingTimelineRepository = require('../../repositories/booking-timeline.repository');

class BookingTimelineService {
  constructor() {
    this.timelineRepo = new BookingTimelineRepository();
  }

  _generateStandardMessage(fromStatus, toStatus, actor) {
    return `System Audit: Actor ${actor.role} successfully updated status state parameters from "${fromStatus}" to "${toStatus}".`;
  }

  /**
   * Formats and logs a unified state update record to the immutable timeline collection
   */
  async logTransition({ booking, fromStatus, toStatus, actor, metadata = {}, session = null }) {
    const actionKey = `${fromStatus}_TO_${toStatus}`.toUpperCase();
    const cleanMessage = this._generateStandardMessage(fromStatus, toStatus, actor);

    const timelinePayload = {
      bookingId: booking._id,
      status: toStatus,
      action: actionKey,
      message: cleanMessage,
      triggeredBy: {
        userId: actor.userId,
        role: actor.role
      },
      metadata
    };

    return this.timelineRepo.append(timelinePayload, session);
  }

  async getHistoryForBooking(bookingId) {
    return this.timelineRepo.fetchChronologicalHistory(bookingId);
  }
}

module.exports = BookingTimelineService;
