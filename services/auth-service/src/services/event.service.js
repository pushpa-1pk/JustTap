const logger = require("./logger.service");

class EventService {
  async publish(eventName, payload) {
    logger.info("DOMAIN_EVENT", {
      eventName,
      payload,
      publishedAt: new Date().toISOString(),
    });
  }
}

module.exports = new EventService();
