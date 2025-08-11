const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipients: [{ type: String, required: true }],
  scheduledTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Campaign', campaignSchema);