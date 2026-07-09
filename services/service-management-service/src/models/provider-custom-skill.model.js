const mongoose = require("mongoose");

const CUSTOM_SKILL_STATUSES = ["Pending", "Approved", "Rejected"];

const providerCustomSkillSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: CUSTOM_SKILL_STATUSES,
      default: "Pending",
      index: true,
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    convertedServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

providerCustomSkillSchema.index(
  { providerId: 1, skillName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("ProviderCustomSkill", providerCustomSkillSchema);
module.exports.CUSTOM_SKILL_STATUSES = CUSTOM_SKILL_STATUSES;
