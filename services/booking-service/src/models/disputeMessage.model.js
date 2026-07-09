const mongoose = require('mongoose');

const DisputeMessageSchema = new mongoose.Schema(
  {
    disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookingDispute', required: true, index: true },
    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      role: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN'], required: true }
    },
    messageContent: { type: String, required: true, trim: true, maxLength: 2000 },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true }
      }
    ],
    // Hidden Administrative Flags (Protects internal operational coordination notes)
    isInternalNote: { type: Boolean, default: false, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

DisputeMessageSchema.index({ disputeId: 1, createdAt: 1 });

module.exports = mongoose.model('DisputeMessage', DisputeMessageSchema);