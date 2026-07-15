const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema(
  {
    aggregateType: { type: String, required: true, index: true }, // e.g., "Payment", "Settlement"
    aggregateId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    
    // P1 Infrastructure Upgrades: Schema drift protections & absolute ordering parameters
    schemaVersion: { type: Number, default: 1, required: true },
    sequenceNumber: { type: Number, required: true }, // Monotonically increasing counter per aggregateId
    
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
      default: "PENDING",
      index: true
    },
    attempts: { type: Number, default: 0, min: 0 },
    errorTrace: { type: String },
    correlationId: { type: String, required: true, index: true },

    workerId: { type: String, default: null, index: true },
    lockedAt: { type: Date, default: null, index: true },
    nextRetryAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// P2 Performance Optimization: Multi-key composite index tailored for polling workers
outboxEventSchema.index({ status: 1, attempts: 1, createdAt: 1 });
// Compound unique index ensuring no out-of-order sequence can be generated for an aggregate container
outboxEventSchema.index({ aggregateId: 1, sequenceNumber: 1 }, { unique: true });

module.exports = mongoose.model("OutboxEvent", outboxEventSchema);