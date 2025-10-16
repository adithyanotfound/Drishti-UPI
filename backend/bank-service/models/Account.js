const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  upiId: { type: String, unique: true, required: true },
  balance: { type: Number, default: 10000 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);
