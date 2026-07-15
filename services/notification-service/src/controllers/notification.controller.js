const { publishStatus } = require('../events/publishers/notificationStatusPublisher');

class NotificationController {
  constructor(container) {
    this.container = container;
  }

  get deviceRepo() {
    return this.container.resolve('deviceRepository');
  }

  get preferenceRepo() {
    return this.container.resolve('preferenceRepository');
  }

  get notificationRepo() {
    return this.container.resolve('notificationRepository');
  }

  registerDevice = async (req, res, next) => {
    try {
      const out = await this.deviceRepo.registerDeviceToken(req.user.id, req.body);
      return res.status(200).json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  };

  updateUserPreferences = async (req, res, next) => {
    try {
      const out = await this.preferenceRepo.updateOne(
        { userId: req.user.id },
        { $set: req.body }
      );
      return res.status(200).json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  };

  fetchNotificationFeed = async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const skip = Math.max(Number(req.query.skip || 0), 0);
      const feed = await this.notificationRepo.find(
        { userId: req.user.id },
        { sort: { createdAt: -1 }, limit, skip }
      );
      return res.status(200).json({ success: true, data: feed });
    } catch (err) {
      next(err);
    }
  };

  markNotificationRead = async (req, res, next) => {
    try {
      const notification = await this.notificationRepo.markAsRead(req.params.id, req.user.id);
      if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found.' });
      }

      await publishStatus(notification._id, 'read');
      return res.status(200).json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  };

  markNotificationClicked = async (req, res, next) => {
    try {
      const notification = await this.notificationRepo.markAsClicked(req.params.id, req.user.id);
      if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found.' });
      }

      await publishStatus(notification._id, 'clicked');
      return res.status(200).json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = NotificationController;
