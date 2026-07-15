const BaseRepository = require('./base.repository');
const Notification = require('../models/notification.model');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async markAsRead(id, userId) {
    return this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status: 'READ' } },
      { new: true }
    ).exec();
  }

  async markAllUserNotificationsRead(userId) {
    return this.model.updateMany(
      { userId, status: { $ne: 'READ' } },
      { $set: { status: 'READ' } }
    ).exec();
  }

  async markAsClicked(id, userId) {
    return this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status: 'CLICKED' } },
      { new: true }
    ).exec();
  }
}

module.exports = NotificationRepository;
