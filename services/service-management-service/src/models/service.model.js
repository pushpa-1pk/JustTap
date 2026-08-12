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
    icon: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    pricing: {
      type: {
        type: String,
        enum: ["FIXED", "BASE_PLUS_VARIABLE"],
        default: "BASE_PLUS_VARIABLE",
      },
      basePrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      unit: {
        type: String,
        enum: ["HOUR", "SERVICE", "FLAT"],
        default: "HOUR",
      },
      additionalUnitPrice: {
        type: Number,
        min: 0,
        default: 0,
      },
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
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
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
    createdBy: {
      type: String,
      trim: true,
      default: null,
    },
    updatedBy: {
      type: String,
      trim: true,
      default: null,
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
