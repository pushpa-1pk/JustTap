const { getChannel } = require('../../config/rabbitmq');
const { baseEventSchema } = require('../schemas/eventValidation');

async function startEventConsumer(container) {
  const channel = getChannel();
  const logger = container.resolve('logger');
  const orchestrator = container.resolve('orchestratorService');
  
  const INGRESS_QUEUE = 'notification.ingress.events';
  await channel.assertQueue(INGRESS_QUEUE, { durable: true });

  const dynamicTopicBindings = [
    'booking.*',
    'payment.*',
    'wallet.*',
    'tracking.*',
    'auth.*',
    'matching.*'
  ];

  for (const bindingRoute of dynamicTopicBindings) {
    await channel.bindQueue(INGRESS_QUEUE, 'justtap.events', bindingRoute);
  }

  channel.prefetch(30);
  logger.info('📡 Subscribed to market event broker streaming interfaces.');

  channel.consume(INGRESS_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const rawPayload = JSON.parse(msg.content.toString());
      const { error } = baseEventSchema.validate(rawPayload);
      if (error) {
        logger.error(`Dropped invalid event structural trace signature: ${error.message}`);
        return channel.ack(msg);
      }

      await orchestrator.processIncomingEvent(msg.fields.routingKey, rawPayload);
      channel.ack(msg);
    } catch (err) {
      logger.error('Consumer processing exception hit:', err);
      channel.nack(msg, false, false); // Route immediately to DLQ path
    }
  });
}

module.exports = { startEventConsumer };