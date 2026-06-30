const mongoose = require("mongoose");
const { PLATFORMS } = require("../utils/constants");

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    platform: {
      type: String,
      enum: Object.values(PLATFORMS),
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    appVersion: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ deviceId: 1 });
sessionSchema.index({ isOnline: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
