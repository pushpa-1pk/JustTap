const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    requestType: {
      type: String,
      enum: ["initial", "resubmit"],
      default: "initial",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    requiredDocuments: {
      aadhar: { type: Boolean, default: true },
      pan: { type: Boolean, default: true },
      profilePhoto: { type: Boolean, default: true },
    },
    submittedDocuments: {
      aadhar: { type: Boolean, default: false },
      pan: { type: Boolean, default: false },
      profilePhoto: { type: Boolean, default: false },
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
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

approvalRequestSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
