const mongoose = require("mongoose");

const providerServiceSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
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

providerServiceSchema.index({ providerId: 1, serviceId: 1 }, { unique: true });
providerServiceSchema.index({ serviceId: 1, price: 1 });
providerServiceSchema.index({ serviceId: 1, experience: -1 });

module.exports = mongoose.model("ProviderService", providerServiceSchema);
