class BaseHandler {
  constructor(eventType) {
    this.eventType = eventType;
  }
  
  extractMeta(payload) {
    throw new Error('extractMeta() processing routine must be overriden.');
  }

  getCategory() {
    return 'system';
  }
}

module.exports = BaseHandler;