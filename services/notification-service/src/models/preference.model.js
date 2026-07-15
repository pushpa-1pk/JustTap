const mongoose = require('mongoose');

const PreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  categories: {
    booking: { type: Boolean, default: true },
    payment: { type: Boolean, default: true },
    wallet: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    support: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    system: { type: Boolean, default: true }
  },
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    inapp: { type: Boolean, default: true }
  },
  language: { type: String, default: 'en' }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', PreferenceSchema);