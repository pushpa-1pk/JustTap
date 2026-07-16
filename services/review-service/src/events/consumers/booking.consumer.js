const rabbitmqConfig = require('../../config/rabbitmq');
const config = require('../../config/env');
const logger = require('../../config/logger');
const bookingHandler = require('../handlers/booking.handler');

class BookingConsumer {
  async startListening() {
    try {
      const channel = rabbitmqConfig.getChannel();
      const targetQueue = config.rabbitmq.queues.bookingCompleted;

      logger.info(`Registering background listener on queue plane: [${targetQueue}]`);

      // Set prefetch limit to prevent overloading a single node during high traffic
      await channel.prefetch(10);

      await channel.consume(targetQueue, async (msg) => {
        if (!msg) {
          logger.warn('Consumer received empty message payload from broker context window.');
          return;
        }

        try {
          const contentText = msg.content.toString();
          const parsingEnvelope = JSON.parse(contentText);
          
          logger.info(`Received event transaction frame. Routing key: [${msg.fields.routingKey}]`);

          // Route to the appropriate command handler based on the routing key
          if (msg.fields.routingKey === config.rabbitmq.routingKeys.bookingCompleted) {
            await bookingHandler.handleBookingCompleted(parsingEnvelope.payload || parsingEnvelope.data || parsingEnvelope);
          } else {
            logger.warn(`Discarding unmapped event routing string logic identifier: ${msg.fields.routingKey}`);
          }

          // Acknowledge the message upon successful processing
          channel.ack(msg);
        } catch (handlerError) {
          logger.error('Error processing event stream message payload:', handlerError);
          
          // Re-queue the message if it's a transient failure, otherwise discard it to prevent deadlocks
          const shouldRequeue = !msg.fields.redelivered;
          channel.nack(msg, false, shouldRequeue);
          
          logger.warn(`Message handling failed. Strategy applied: ${shouldRequeue ? 'REQUEUE' : 'DISCARD/DLQ'}`);
        }
      }, { noAck: false });

      logger.info(`AMQP consumer channel successfully established for queue: [${targetQueue}]`);
    } catch (criticalConsumerError) {
      logger.error('Critical operational failure initializing AMQP background consumer framework:', criticalConsumerError);
      throw criticalConsumerError;
    }
  }
}

module.exports = new BookingConsumer();
