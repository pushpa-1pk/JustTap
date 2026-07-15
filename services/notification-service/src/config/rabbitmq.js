const logger = require('../config/logger');

let connection = null;
let channel = null;
let connectPromise = null;

async function connectRabbitMQ(envInstance) {
  if (channel) {
    return { connection, channel };
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      const amqp = require('amqplib');
      connection = await amqp.connect(envInstance.RABBITMQ_URI);
      channel = await connection.createChannel();

      await channel.assertExchange('justtap.events', 'topic', { durable: true });
      await channel.assertQueue('notification.ingress.events', { durable: true });

      const activeChannels = ['push', 'email', 'sms', 'inapp'];
      for (const item of activeChannels) {
        const mainQueue = `notification.${item}`;
        const retryQueue = `${mainQueue}.retry`;
        const dlqQueue = `${mainQueue}.dlq`;

        await channel.assertQueue(dlqQueue, { durable: true });
        await channel.assertQueue(retryQueue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': mainQueue
          }
        });
        await channel.assertQueue(mainQueue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': dlqQueue
          }
        });
      }

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Clearing cached broker state.');
        connection = null;
        channel = null;
        connectPromise = null;
      });

      connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
      });

      logger.info('RabbitMQ topology ready for notification-service.');
      return { connection, channel };
    } catch (error) {
      connectPromise = null;
      logger.error('Critical broker connection assertion failure:', error);
      throw error;
    }
  })();

  return connectPromise;
}

function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not bound to active thread contexts.');
  }

  return channel;
}

async function closeRabbitMQ() {
  const activeChannel = channel;
  const activeConnection = connection;
  channel = null;
  connection = null;
  connectPromise = null;

  if (activeChannel) {
    await activeChannel.close().catch(() => {});
  }

  if (activeConnection) {
    await activeConnection.close().catch(() => {});
  }
}

module.exports = { connectRabbitMQ, getChannel, closeRabbitMQ };
