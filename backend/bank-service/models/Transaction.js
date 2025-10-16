const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txnSchema);
