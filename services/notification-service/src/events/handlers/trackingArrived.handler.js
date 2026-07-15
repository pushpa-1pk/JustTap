const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class TrackingArrivedHandler extends BaseHandler {
  constructor() {
    super('tracking.arrived');
  }

  extractMeta(payload) {
    return {
      templateName: 'tracking.arrived',
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

module.exports = TrackingArrivedHandler;
