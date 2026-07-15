const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class WalletCreditHandler extends BaseHandler {
  constructor() {
    super('wallet.credit');
  }

  extractMeta(payload) {
    return {
      templateName: 'wallet.credit',
      priority: PRIORITIES.NORMAL,
      channels: ['PUSH', 'IN_APP'],
      templateVars: {
        amount: payload.amount,
        balance: payload.balance || payload.currentBalance || 'updated'
      },
      metadata: {
        walletTransactionId: payload.transactionId || null
      }
    };
  }

  getCategory() {
    return 'wallet';
  }
}

module.exports = WalletCreditHandler;
