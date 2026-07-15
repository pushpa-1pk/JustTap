const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class BookingAcceptedHandler extends BaseHandler {
  constructor() {
    super('booking.accepted');
  }

  extractMeta(payload) {
    return {
      templateName: 'booking.accepted',
      priority: PRIORITIES.HIGH,
      channels: ['PUSH', 'IN_APP'],
      templateVars: {
        providerName: payload.providerName || payload.providerSnapshot?.businessName || 'Your provider'
      },
      metadata: {
        bookingId: payload.bookingId,
        phone: payload.phone || payload.customerPhone || null
      }
    };
  }

  getCategory() {
    return 'booking';
  }
}

module.exports = BookingAcceptedHandler;
