const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class PaymentSuccessHandler extends BaseHandler {
  constructor() {
    super('payment.success');
  }

  extractMeta(payload) {
    const channels = ['PUSH', 'IN_APP'];
    if (payload.email || payload.userEmail) {
      channels.push('EMAIL');
    }

    return {
      templateName: 'payment.success',
      priority: PRIORITIES.NORMAL,
      channels,
      templateVars: {
        amount: payload.amount,
        transactionId: payload.transactionId
      },
      metadata: {
        transactionId: payload.transactionId,
        email: payload.email || payload.userEmail || null
      }
    };
  }

  getCategory() {
    return 'payment';
  }
}

module.exports = PaymentSuccessHandler;
