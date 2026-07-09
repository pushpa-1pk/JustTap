const mongoose = require("mongoose");

const providerDocumentSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      index: true,
    },

    documentType: {
      type: String,
      required: true,
      enum: ["aadhar", "pan", "profile_photo", "trade_license", "gst", "shop_license"],
      immutable: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    storageProvider: {
      type: String,
      default: null,
      trim: true,
    },
    storageKey: {
      type: String,
      default: null,
      trim: true,
    },
    mimeType: {
      type: String,
      default: null,
      trim: true,
    },
    originalName: {
      type: String,
      default: null,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
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
providerDocumentSchema.index({ documentType: 1 });

// Only one latest version of each document type per provider
providerDocumentSchema.index(
  {
    providerId: 1,
    documentType: 1,
    isLatest: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isLatest: true },
  }
);

module.exports = mongoose.model(
  "ProviderDocument",
  providerDocumentSchema,
  "provider_documents"
);
