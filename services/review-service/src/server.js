const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const rabbitmqConfig = require('./config/rabbitmq');
const bookingConsumer = require('./events/consumers/booking.consumer');

let serverInstance = null;

const runBootstrapSequence = async () => {
  try {
    logger.info('Commencing Phase 10 Review Microservice structural boot sequence...');

    // 1. Establish Database Connection Pool Setup
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Database persistence engine connection successfully connected.');

    // 2. Connect Message Broker Infrastructure & Topology Maps
    await rabbitmqConfig.connect();

    // 3. Instantiate and Trigger Background Event Queue Ingestion Listeners
    await bookingConsumer.startListening();

    // 4. Fire up the Express HTTP Listening Port Engine
    serverInstance = app.listen(config.port, () => {
      logger.info(`Review & Rating Engine processing actively on network allocation socket port: [${config.port}]`);
    });

  } catch (initializationFailure) {
    logger.error('Fatal initialization error during service boot phase:', initializationFailure);
    process.exit(1);
  }
};

// Handle unhandled runtime exceptions gracefully without losing system logs
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Runtime Exception Event: ${error.message} | Purging process immediately.`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection Trace Detected:', reason);
});

// Resilient Graceful Teardown Handler for Container Pod Lifecycles (K8s SIGTERM/SIGINT)
const triggerGracefulShutdown = (signalName) => {
  logger.warn(`Signal received: [${signalName}]. Initializing isolation sequence loops...`);

  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info('Express HTTP ingress network pool deactivated.');
      
      try {
        // Safe disconnection matrices
        await mongoose.connection.close();
        logger.info('MongoDB database persistence driver closed safely.');
        
        await rabbitmqConfig.disconnect();
        logger.info('RabbitMQ AMQP messaging pipeline pools separated.');
        
        logger.info('Microservice node teardown sequence completed cleanly. Terminating process pipeline.');
        process.exit(0);
      } catch (shutdownException) {
        logger.error('Error encountered while processing service shutdown cycles:', shutdownException);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => triggerGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => triggerGracefulShutdown('SIGINT'));

// Execute Boot Configuration Engine
runBootstrapSequence();
