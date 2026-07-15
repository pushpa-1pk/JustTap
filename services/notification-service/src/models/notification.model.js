const mongoose = require('mongoose');
const { PRIORITIES, STATUSES } = require('../constants/notification.constants');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  priority: { type: String, enum: Object.values(PRIORITIES), default: PRIORITIES.NORMAL, index: true },
  status: { type: String, enum: Object.values(STATUSES), default: STATUSES.CREATED, index: true },
  channels: [{ type: String }],
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
