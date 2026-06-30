const mongoose = require("mongoose");

const providerDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      index: true,
    },

    documentType: {
      type: String,
      required: true,
      enum: [
        "AADHAAR",
        "PAN",
        "PROFILE_PHOTO",
        "TRADE_LICENSE",
      ],
      immutable: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING",
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
providerDocumentSchema.index({ userId: 1 });
providerDocumentSchema.index({ documentType: 1 });
providerDocumentSchema.index({ status: 1 });

// Only one latest version of each document type per provider
providerDocumentSchema.index(
  {
    userId: 1,
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