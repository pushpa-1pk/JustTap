const mongoose = require('mongoose');
const { ReviewStatus } = require('../constants/review.constants');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true, 
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  serviceId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating value `{VALUE}` must be an absolute integer scalar scale.'
    }
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    index: true
  }],
  status: {
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.APPROVED,
    index: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Compound Indexes for fast frontend matching lookups
reviewSchema.index({ providerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);