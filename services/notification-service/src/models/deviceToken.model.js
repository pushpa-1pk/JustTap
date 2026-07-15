const mongoose = require('mongoose');

const DeviceTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fcmToken: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['ANDROID', 'IOS', 'WEB'], required: true },
  appVersion: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('DeviceToken', DeviceTokenSchema);