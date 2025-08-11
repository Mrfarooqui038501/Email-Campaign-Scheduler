const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  recipient: { type: String, required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  error: { type: String },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EmailLog', emailLogSchema);

