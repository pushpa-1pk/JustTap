const BaseHandler = require('./base.handler');
const { PRIORITIES } = require('../../constants/notification.constants');

class AuthSecurityHandler extends BaseHandler {
  constructor() {
    super('auth.security');
  }

  extractMeta(payload) {
    return {
      templateName: 'auth.security',
      priority: PRIORITIES.CRITICAL,
      channels: ['PUSH', 'EMAIL'],
      templateVars: {
        action: payload.action || 'Security-sensitive account activity',
        timestamp: payload.timestamp || payload.occurredAt || new Date().toISOString()
      },
      metadata: {
        email: payload.email || payload.userEmail || null
      }
    };
  }

  getCategory() {
    return 'system';
  }
}

module.exports = AuthSecurityHandler;
