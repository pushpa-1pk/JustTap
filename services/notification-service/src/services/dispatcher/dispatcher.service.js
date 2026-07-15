const { getChannel } = require('../../config/rabbitmq');
const { STATUSES } = require('../../constants/notification.constants');

class DispatcherService {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.notificationRepo = container.resolve('notificationRepository');
  }

  async dispatchToChannels(notification, preferences, renderedContent) {
    const mqChannel = getChannel();
    
    for (const channelTarget of notification.channels) {
      const normalizedChannelKey = channelTarget.toLowerCase();
      
      // Enforce granular channel permissions validation check rules
      if (preferences.channels[normalizedChannelKey]) {
        const queueTarget = `notification.${normalizedChannelKey}`;
        const taskPayload = {
          notificationId: notification._id,
          userId: notification.userId,
          title: renderedContent.title,
          body: renderedContent.body,
          priority: notification.priority,
          metadata: notification.metadata,
          attempt: 1
        };

        mqChannel.sendToQueue(
          queueTarget,
          Buffer.from(JSON.stringify(taskPayload)),
          { deliveryMode: 2, priority: notification.priority === 'CRITICAL' ? 9 : 4 }
        );
      }
    }

    await this.notificationRepo.updateOne(
      { _id: notification._id },
      { $set: { status: STATUSES.QUEUED } }
    );
  }
}

module.exports = DispatcherService;