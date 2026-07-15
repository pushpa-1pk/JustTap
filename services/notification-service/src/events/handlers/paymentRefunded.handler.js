const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class PaymentRefundedHandler extends BaseHandler {
  constructor() {
    super('payment.refunded');
  }

  extractMeta(payload) {
    const channels = ['PUSH', 'IN_APP'];
    if (payload.email || payload.userEmail) {
      channels.push('EMAIL');
    }

    return {
      templateName: 'payment.refunded',
      priority: PRIORITIES.NORMAL,
      channels,
      templateVars: {
        amount: payload.amount,
        refundId: payload.refundId || payload.transactionId || payload.referenceId || 'N/A'
      },
      metadata: {
        refundId: payload.refundId || null,
        email: payload.email || payload.userEmail || null
      }
    };
  }

  getCategory() {
    return 'payment';
  }
}

module.exports = PaymentRefundedHandler;
