const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class WalletDebitHandler extends BaseHandler {
  constructor() {
    super('wallet.debit');
  }

  extractMeta(payload) {
    return {
      templateName: 'wallet.debit',
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

module.exports = WalletDebitHandler;
