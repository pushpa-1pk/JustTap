const mongoose = require('mongoose');

const BookingEventSchema = new mongoose.Schema(
  {
    bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true, 
      index: true 
    },
    eventType: { 
      type: String, 
      required: true, 
      uppercase: true, 
      index: true 
    },
    // Set only for events that must be emitted once for a booking.
    dedupeKey: {
      type: String,
      default: null,
      trim: true
    },
    payload: { 
      type: mongoose.Schema.Types.Mixed, 
      required: true 
    },
    published: { 
      type: Boolean, 
      default: false, 
      required: true, 
      index: true 
    },
    retryCount: { 
      type: Number, 
      default: 0, 
      required: true 
    },
    publishedAt: { 
      type: Date, 
      default: null 
    }
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Index optimizes background workers polling for unpublished events chronologically
BookingEventSchema.index({ published: 1, createdAt: 1 });
BookingEventSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

module.exports = mongoose.model('BookingEvent', BookingEventSchema);
