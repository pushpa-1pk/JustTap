const amqplib = require('amqplib');
const config = require('./env');
const logger = require('./logger');

let connection = null;
let channel = null;
let reconnectTimer = null;

const connect = async () => {
  if (connection && channel) return { connection, channel };

  try {
    logger.info('Initializing resilient RabbitMQ topologies connection...');
    connection = await amqplib.connect(config.rabbitmq.uri);
    channel = await connection.createChannel();

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection encountered unhandled error:', err);
      reconnect();
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed framework layer trigger. Reconnecting...');
      reconnect();
    });

    // Asset Assertions: Exchanges
    await channel.assertExchange(config.rabbitmq.exchanges.events, 'topic', { durable: true });

    // Asset Assertions: Queues & Bindings
    await channel.assertQueue(config.rabbitmq.queues.bookingCompleted, { durable: true });
    await channel.bindQueue(
      config.rabbitmq.queues.bookingCompleted,
      config.rabbitmq.exchanges.events,
      config.rabbitmq.routingKeys.bookingCompleted
    );

    logger.info('RabbitMQ network connection topologies assert matching rules completed successfully.');
    return { connection, channel };
  } catch (error) {
    logger.error('Critical failure establishing RabbitMQ connection setup:', error);
    throw error;
  }
};

const reconnect = () => {
  connection = null;
  channel = null;
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      try {
        await connect();
      } catch (error) {
        logger.error('RabbitMQ reconnect attempt failed.', error);
      }
    }, 5000);
  }
};

const getChannel = () => {
  if (!channel) throw new Error('Cannot request channel instance before running bootstrap connectivity routing.');
  return channel;
};

const disconnect = async () => {
  if (channel) {
    await channel.close().catch(() => {});
  }
  if (connection) {
    await connection.close().catch(() => {});
  }
  channel = null;
  connection = null;
};

module.exports = { connect, getChannel, disconnect };
