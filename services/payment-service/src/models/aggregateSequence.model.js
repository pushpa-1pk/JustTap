const mongoose = require("mongoose");

const aggregateSequenceSchema = new mongoose.Schema(
  {
    aggregateId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    aggregateType: { type: String, required: true, index: true },
    currentSequence: { type: Number, default: 0, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AggregateSequence", aggregateSequenceSchema);