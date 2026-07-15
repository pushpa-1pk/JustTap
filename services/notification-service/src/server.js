require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const container = require('./bootstrap/container');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { startEventConsumer } = require('./events/consumers/eventConsumer');

async function launchSystemServerInstance() {
  try {
    const initializedContainer = await container.init();
    const env = initializedContainer.resolve('env');
    const logger = initializedContainer.resolve('logger');

    await mongoose.connect(env.MONGO_URI);
    logger.info('Primary persistence database connected.');

    await connectRabbitMQ(env);
    await startEventConsumer(initializedContainer);

    const runtimeExecutionPort = env.PORT || 4005;
    const processLifecycleServer = app.listen(runtimeExecutionPort, () => {
      logger.info(`Notification service initialized on port ${runtimeExecutionPort}`);
    });

    const shutdownGracefully = async (signal) => {
      logger.warn(`Termination signal caught [${signal}]. Commencing cleanup.`);
      processLifecycleServer.close(async () => {
        await closeRabbitMQ();
        await mongoose.connection.close();
        logger.info('Lifecycle shutdown completed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
  } catch (error) {
    console.error('CRITICAL: Microservice startup bootstrapper sequence crashed:', error);
    process.exit(1);
  }
}

launchSystemServerInstance();
