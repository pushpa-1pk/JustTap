const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    estimatedDuration: {
      type: Number,
      min: 0,
      default: 60,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

serviceSchema.index({ categoryId: 1, name: 1 }, { unique: true });
serviceSchema.index({ categoryId: 1, slug: 1 }, { unique: true });
serviceSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Service", serviceSchema);
