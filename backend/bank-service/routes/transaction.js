const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// POST /bank/transaction
router.post('/transaction', async (req, res) => {
  try {
    const { sender, receiver, amount } = req.body;
    if (!sender || !receiver || !amount) return res.status(400).json({ error: 'sender, receiver, amount required' });

  if (String(sender).trim().toLowerCase() === String(receiver).trim().toLowerCase()) {
    return res.status(400).json({ status: 'failed', message: 'Cannot send payment to self' });
  }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'invalid amount' });

    // find or create accounts
    let senderAcc = await Account.findOne({ upiId: sender });
    let receiverAcc = await Account.findOne({ upiId: receiver });

    if (!senderAcc) senderAcc = await Account.create({ upiId: sender, balance: 10000 });
    if (!receiverAcc) receiverAcc = await Account.create({ upiId: receiver, balance: 10000 });

    if (senderAcc.balance < amt) {
      // record failed txn
      await Transaction.create({ sender, receiver, amount: amt, status: 'failed' });
      return res.status(400).json({ status: 'failed', message: 'Insufficient balance' });
    }

    // perform transfer
    senderAcc.balance -= amt;
    receiverAcc.balance += amt;
    senderAcc.updatedAt = new Date();
    receiverAcc.updatedAt = new Date();

    await senderAcc.save();
    await receiverAcc.save();

    const txn = await Transaction.create({ sender, receiver, amount: amt, status: 'success' });

    res.json({ status: 'success', message: `Payment of ₹${amt} completed.`, transactionId: txn._id });
  } catch (err) {
    console.error('Bank transaction error', err);
    res.status(500).json({ status: 'failed', message: 'Internal server error' });
  }
});

// GET /bank/history/:upiId
router.get('/history/:upiId', async (req, res) => {
  try {
    const { upiId } = req.params;
    const txns = await Transaction.find({ $or: [{ sender: upiId }, { receiver: upiId }] }).sort({ createdAt: -1 });
    res.json({ upiId, count: txns.length, transactions: txns });
  } catch (err) {
    console.error('History error', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /bank/balance/:upiId
router.get('/balance/:upiId', async (req, res) => {
  try {
    const { upiId } = req.params;
    let account = await Account.findOne({ upiId });
    if (!account) {
      account = await Account.create({ upiId, balance: 10000 });
    }
    res.json({ upiId, balance: account.balance, updatedAt: account.updatedAt });
  } catch (err) {
    console.error('Balance error', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

module.exports = router;
