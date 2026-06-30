const mongoose = require("mongoose");
const { PLATFORMS } = require("../utils/constants");

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    familyId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    deviceName: {
      type: String,
    },
    platform: {
      type: String,
      enum: Object.values(PLATFORMS),
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    appVersion: {
      type: String,
    },
    lastUsedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
    },
    replacedByJti: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ deviceId: 1 });
refreshTokenSchema.index({ userId: 1, deviceId: 1 });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
