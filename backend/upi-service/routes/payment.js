const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const BANK_URL = process.env.BANK_SERVICE_URL || 'http://localhost:4000/bank/transaction';

// POST /payment
// Body: { sender: "mobile@upi", receiver: "someone@upi", amount: 500 }
router.post('/', async (req, res) => {
  try {
    const { sender, receiver, amount } = req.body;
    if (!sender || !receiver || !amount) {
      return res.status(400).json({ error: 'sender, receiver, amount required' });
    }

  if (String(sender).trim().toLowerCase() === String(receiver).trim().toLowerCase()) {
    return res.status(400).json({ error: 'Cannot send payment to self' });
  }

    // Basic validation: positive amount
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'invalid amount' });

    // Ensure both users exist (registered)
    const senderUser = await User.findOne({ upiId: sender });
    const receiverUser = await User.findOne({ upiId: receiver });
    if (!senderUser) return res.status(404).json({ error: 'Sender not found' });
    if (!receiverUser) return res.status(404).json({ error: 'Receiver not found' });

    // Forward to bank service
    const bankResp = await axios.post(BANK_URL, { sender, receiver, amount: amt }, { timeout: 10000 });

    // Bank returns status and optional reference id
    const bankData = bankResp.data || {};

    // Save transaction locally (upi-service's history)
    const txn = new Transaction({
      sender, receiver, amount: amt,
      status: bankData.status === 'success' ? 'success' : 'failed',
      bankReference: bankData.transactionId || bankData.message || null
    });
    await txn.save();

    if (bankData.status === 'success') {
      // enrich response with usernames when available
      const [senderUser, receiverUser] = await Promise.all([
        User.findOne({ upiId: sender }),
        User.findOne({ upiId: receiver })
      ]);
      return res.json({
        res: `Payment to ${(receiverUser && receiverUser.username) || receiver.split('@')[0]} has been successfully completed.`,
        transaction: txn,
        sender: { upiId: sender, username: senderUser ? senderUser.username : undefined },
        receiver: { upiId: receiver, username: receiverUser ? receiverUser.username : undefined }
      });
    } else {
      return res.status(500).json({ error: 'Bank failed to complete transaction', details: bankData });
    }
  } catch (err) {
    console.error('Payment error', err?.response?.data || err.message || err);
    // Attempt to log failed transaction
    try {
      const { sender, receiver, amount } = req.body;
      await Transaction.create({ sender, receiver, amount: Number(amount), status: 'failed' });
    } catch (e) { /* ignore */ }

    res.status(500).json({ error: 'Payment failed', details: err?.response?.data || err.message });
  }
});

// GET /payment/history/:upiId
router.get('/history/:upiId', async (req, res) => {
  try {
    const { upiId } = req.params;
    const txns = await Transaction.find({ $or: [{ sender: upiId }, { receiver: upiId }] }).sort({ createdAt: -1 });
    res.json({ upiId, count: txns.length, transactions: txns });
  } catch (err) {
    console.error('History error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
