const mongoose = require('mongoose');

const pathHistorySchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  // Single string field hosting thousands of compressed coordinate values seamlessly
  encodedPath: {
    type: String,
    required: true
  },
  totalDistanceMeters: {
    type: Number,
    default: 0
  },
  totalPointsCollected: {
    type: Number,
    required: true
  },
  // High-performance search coordinates for bounding area queries
  boundingBox: {
    minLatitude: { type: Number, required: true },
    maxLatitude: { type: Number, required: true },
    minLongitude: { type: Number, required: true },
    maxLongitude: { type: Number, required: true }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexing wrapper for optimized auditing lookups
pathHistorySchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model('PathHistory', pathHistorySchema);