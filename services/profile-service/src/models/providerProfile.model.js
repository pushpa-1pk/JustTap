const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },

    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,

      validate: {
        validator: function (value) {
          return (
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message: "Invalid longitude or latitude",
      },
    },
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    workingRadius: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    currentLocation: {
      type: pointSchema,
      required: true,
    },

    workingHours: {
    start: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    end: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    }
    },

    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "VERIFIED",
        "REJECTED",
      ],
      default: "PENDING",
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalJobs: {
      type: Number,
      default: 0,
      min: 0,
    },

    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
providerProfileSchema.index({ currentLocation: "2dsphere" });
providerProfileSchema.index({ verificationStatus: 1 });
providerProfileSchema.index({ isAvailable: 1 });

module.exports = mongoose.model(
  "ProviderProfile",
  providerProfileSchema
);