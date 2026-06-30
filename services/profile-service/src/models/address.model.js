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

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      immutable: true,
      index: true,
    },

    label: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
      trim: true,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    location: {
      type: pointSchema,
      required: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Address", addressSchema);