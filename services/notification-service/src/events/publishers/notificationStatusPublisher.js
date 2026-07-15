const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../config/logger');

async function publishStatus(notificationId, status, error = null) {
  try {
    const channel = getChannel();
    const exchange = 'justtap.events';
    const routingKey = `notification.${status}`;
    
    const message = {
      notificationId,
      status: status.toUpperCase(),
      timestamp: new Date().toISOString(),
      error
    };

    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      contentType: 'application/json'
    });
  } catch (err) {
    logger.error('Failed to dispatch external state validation execution trace out:', err);
  }
}

module.exports = { publishStatus };
