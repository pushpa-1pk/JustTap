const mongoose = require("mongoose");

const customerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", null],
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
      trim: true,
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
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" }
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

customerProfileSchema.methods.calculateCompletion = function calculateCompletion() {
  const fields = [
    Boolean(this.fullName),
    Boolean(this.email),
    Boolean(this.gender),
    Boolean(this.dateOfBirth),
    Boolean(this.language),
    Boolean(this.profileImage),
    Boolean(this.emergencyContact && this.emergencyContact.name && this.emergencyContact.phone)
  ];

  return Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );
};

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
