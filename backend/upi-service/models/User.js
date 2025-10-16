const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  upiId: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String },
  balance: { type: Number, default: 10000 },
  signedIn: { type: Boolean, default: false },
  signedInUntil: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
