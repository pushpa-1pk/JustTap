const mongoose = require('mongoose');

const providerRatingSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  averageRating: {
    type: Number,
    required: true,
    default: 0.0,
    min: 0.0,
    max: 5.0
  },
  totalReviews: {
    type: Number,
    required: true,
    default: 0
  },
  ratingBreakdown: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  lastReviewAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

module.exports = mongoose.model('ProviderRating', providerRatingSchema);