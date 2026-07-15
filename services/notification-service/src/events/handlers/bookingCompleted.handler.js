const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class BookingCompletedHandler extends BaseHandler {
  constructor() {
    super('booking.completed');
  }

  extractMeta(payload) {
    return {
      templateName: 'booking.completed',
      priority: PRIORITIES.NORMAL,
      channels: ['PUSH', 'IN_APP'],
      templateVars: {
        providerName: payload.providerName || payload.providerSnapshot?.businessName || 'Your provider'
      },
      metadata: {
        bookingId: payload.bookingId || null
      }
    };
  }

  getCategory() {
    return 'booking';
  }
}

module.exports = BookingCompletedHandler;
