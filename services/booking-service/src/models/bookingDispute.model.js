const mongoose = require('mongoose');
const { DISPUTE_STATUS, DISPUTE_PRIORITY, DISPUTE_REASON } = require('../constants/dispute.constants');

const BookingDisputeSchema = new mongoose.Schema(
  {
    disputeNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reasonCategory: { type: String, enum: Object.values(DISPUTE_REASON), required: true },
    description: { type: String, required: true, trim: true, maxLength: 3000 },
    
    evidence: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['IMAGE', 'VIDEO', 'PDF', 'AUDIO'], required: true },
        uploadedBy: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN'], required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    
    disputeStatus: { type: String, enum: Object.values(DISPUTE_STATUS), default: DISPUTE_STATUS.OPEN, required: true },
    priorityLevel: { type: String, enum: Object.values(DISPUTE_PRIORITY), default: DISPUTE_PRIORITY.MEDIUM, required: true },
    adminRemarks: { type: String, default: null },
    resolutionDetails: {
      resolutionType: { type: String, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      resolvedAt: { type: Date, default: null }
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('BookingDispute', BookingDisputeSchema);