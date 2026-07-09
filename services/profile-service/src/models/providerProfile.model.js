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
      },
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    profileImageStorageProvider: {
      type: String,
      default: null,
      trim: true,
    },
    profileImageStorageKey: {
      type: String,
      default: null,
      trim: true,
    },

    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    approvalRequestedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
providerProfileSchema.index({ currentLocation: "2dsphere" });

providerProfileSchema.methods.calculateCompletion = function calculateCompletion() {
  const fields = [
    Boolean(this.businessName),
    Number.isFinite(this.experience),
    Number.isFinite(this.workingRadius),
    Boolean(this.currentLocation?.coordinates?.length === 2),
    Boolean(this.workingHours?.start && this.workingHours?.end),
    Boolean(this.bio),
    Boolean(this.profileImage),
  ];

  return Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );
};

module.exports = mongoose.model(
  "ProviderProfile",
  providerProfileSchema
);
