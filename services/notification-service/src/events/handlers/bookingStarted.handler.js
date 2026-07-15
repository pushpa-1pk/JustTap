const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class BookingStartedHandler extends BaseHandler {
  constructor() {
    super('booking.started');
  }

  extractMeta(payload) {
    return {
      templateName: 'booking.started',
      priority: PRIORITIES.HIGH,
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

module.exports = BookingStartedHandler;
