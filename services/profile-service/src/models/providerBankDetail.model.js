const mongoose = require("mongoose");

const providerBankDetailSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      index: true,
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Store encrypted account number
    encryptedAccountNumber: {
      type: String,
      required: true,
    },

    // IFSC is public information, no need to encrypt
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    accountType: {
      type: String,
      enum: ["SAVINGS", "CURRENT"],
      default: "SAVINGS",
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "ProviderBankDetail",
  providerBankDetailSchema,
  "provider_bank_details"
);
