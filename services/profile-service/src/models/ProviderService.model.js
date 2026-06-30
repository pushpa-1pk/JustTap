const mongoose = require("mongoose");

const providerServiceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      index: true,
    },

    serviceId: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    priceType: {
      type: String,
      enum: ["hourly", "fixed"],
      default: "fixed",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
providerServiceSchema.index({ userId: 1 });
providerServiceSchema.index({ serviceId: 1 });
providerServiceSchema.index({ isActive: 1 });

// Prevent duplicate services for the same provider
providerServiceSchema.index(
  { userId: 1, serviceId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ProviderService",
  providerServiceSchema
);