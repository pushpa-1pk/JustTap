const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      required: true,
      immutable: true,
      default: "customer",
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    language: {
      type: String,
      default: "English",
      maxlength: 30,
    },

    profileImage: {
      type: String,
      default: "",
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

module.exports = mongoose.model("User", userSchema);