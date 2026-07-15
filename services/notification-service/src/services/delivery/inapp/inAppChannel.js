const Notification = require('../../../models/notification.model');
const { STATUSES } = require('../../../constants/notification.constants');

class InAppChannel {
  constructor(notificationRepo, logger) {
    this.notificationRepo = notificationRepo;
    this.logger = logger;
  }

  async send(jobData) {
    const { notificationId } = jobData;
    
    const model = this.notificationRepo?.model || Notification;
    await model.findByIdAndUpdate(notificationId, {
      status: STATUSES.DELIVERED
    });
    
    return { success: true, provider: 'INTERNAL_DB' };
  }
}

module.exports = InAppChannel;
