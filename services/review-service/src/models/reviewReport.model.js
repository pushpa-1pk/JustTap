const mongoose = require('mongoose');
const { ReportStatus } = require('../constants/review.constants');

const reviewReportSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
    index: true
  },
  reportedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.SUBMITTED,
    index: true
  },
  adminRemark: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

module.exports = mongoose.model('ReviewReport', reviewReportSchema);