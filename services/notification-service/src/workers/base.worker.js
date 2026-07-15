const mongoose = require('mongoose');
const container = require('../bootstrap/container');
const { connectRabbitMQ, getChannel } = require('../config/rabbitmq');
const { STATUSES } = require('../constants/notification.constants');
const { publishStatus } = require('../events/publishers/notificationStatusPublisher');

async function runBaseWorker(channelKey, injectionTokenKey) {
  await container.init();
  const env = container.resolve('env');
  const logger = container.resolve('logger');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI);
  }

  await connectRabbitMQ(env);

  const notificationRepo = container.resolve('notificationRepository');
  const deliveryRepo = container.resolve('deliveryRepository');
  const serviceChannel = container.resolve(injectionTokenKey);

  const mqChannel = getChannel();
  const queueName = `notification.${channelKey}`;
  const retryQueueName = `${queueName}.retry`;
  const dlqName = `${queueName}.dlq`;

  mqChannel.prefetch(15);
  logger.info(`Worker consuming queue: ${queueName}`);

  mqChannel.consume(queueName, async (msg) => {
    if (!msg) {
      return;
    }

    const startExecutionTimestamp = Date.now();
    const taskData = JSON.parse(msg.content.toString());
    const notificationId = taskData.notificationId;
    const attempt = Number(taskData.attempt || 1);

    try {
      await notificationRepo.updateOne(
        { _id: notificationId },
        { $set: { status: STATUSES.PROCESSING } }
      );

      const allowed = await serviceChannel.validate(taskData);
      if (!allowed) {
        mqChannel.ack(msg);
        return;
      }

      const outcome = await serviceChannel.send(taskData);

      await deliveryRepo.create({
        notificationId,
        channel: channelKey.toUpperCase(),
        provider: outcome.provider,
        attempt,
        status: STATUSES.DELIVERED,
        providerMessageId: outcome.providerMessageId,
        latency: Date.now() - startExecutionTimestamp
      });

      await notificationRepo.updateOne(
        { _id: notificationId },
        { $set: { status: STATUSES.DELIVERED } }
      );
      await publishStatus(notificationId, 'sent');
      mqChannel.ack(msg);
    } catch (err) {
      const duration = Date.now() - startExecutionTimestamp;
      logger.error(`Execution error inside [${queueName}] queue stream processor line: ${err.message}`);

      const maxConfiguredRetryAttempts = 3;
      if (attempt < maxConfiguredRetryAttempts) {
        const nextAttemptCount = attempt + 1;
        const computedDelayMs = 15000 * Math.pow(2, attempt);

        logger.warn(`Retrying ${queueName} in ${computedDelayMs / 1000}s`);
        mqChannel.sendToQueue(
          retryQueueName,
          Buffer.from(JSON.stringify({ ...taskData, attempt: nextAttemptCount })),
          {
            deliveryMode: 2,
            persistent: true,
            expiration: String(computedDelayMs)
          }
        );

        mqChannel.ack(msg);
        return;
      }

      await deliveryRepo.create({
        notificationId,
        channel: channelKey.toUpperCase(),
        provider: 'EXHAUSTED_FALLBACK_ERR',
        attempt,
        status: STATUSES.FAILED,
        error: err.message,
        latency: duration
      });

      await notificationRepo.updateOne(
        { _id: notificationId },
        { $set: { status: STATUSES.FAILED } }
      );
      await publishStatus(notificationId, 'failed', err.message);
      mqChannel.sendToQueue(dlqName, Buffer.from(msg.content), {
        deliveryMode: 2,
        persistent: true
      });
      mqChannel.ack(msg);
    }
  });
}

module.exports = { runBaseWorker };
