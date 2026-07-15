const mongoose = require('mongoose');
const { STATUSES } = require('../constants/notification.constants');

const NotificationDeliverySchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
  channel: { type: String, required: true },
  provider: { type: String, required: true },
  attempt: { type: Number, default: 1 },
  status: { type: String, enum: Object.values(STATUSES), required: true },
  responseCode: { type: String },
  providerMessageId: { type: String },
  error: { type: String },
  latency: { type: Number }
}, { timestamps: true });

NotificationDeliverySchema.index({ channel: 1, status: 1 });

module.exports = mongoose.model('NotificationDelivery', NotificationDeliverySchema);