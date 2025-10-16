const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
  sender: { type: String, required: true },      // upiId
  receiver: { type: String, required: true },    // upiId
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success','failed'], default: 'success' },
  bankReference: { type: String },               // optional id from bank service
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txnSchema);
