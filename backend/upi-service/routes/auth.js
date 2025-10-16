const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { generateQrAndUpload } = require('../utils/qr');
const BANK_BASE = process.env.BANK_SERVICE_BASE || 'http://localhost:4000';

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { mobile, username } = req.body;
    if (!mobile) return res.status(400).json({ error: 'mobile is required' });
    if (!username) return res.status(400).json({ error: 'username is required' });

    const upiId = `${mobile}@upi`;
    const exists = await User.findOne({ $or: [{ mobile }, { username }] });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    // generate QR and upload
    const qrCodeUrl = await generateQrAndUpload(upiId);

    const user = new User({ mobile, username, upiId, qrCodeUrl, balance: 10000 });
    await user.save();

    res.json({
      message: 'User registered',
      user: { mobile, username, upiId, qrCodeUrl, balance: user.balance }
    });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
// This endpoint is called by glasses AFTER local fingerprint verifies.
// It sets signedIn=true for 10 minutes.
router.post('/login', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'mobile is required' });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.signedIn = true;
    user.signedInUntil = expiry;
    await user.save();

    res.json({ message: 'Signed in', upiId: user.upiId, expiresAt: expiry });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'mobile is required' });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.signedIn = false;
    user.signedInUntil = null;
    await user.save();

    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/status/:mobile
router.get('/status/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // check expiry
    if (user.signedIn && user.signedInUntil && user.signedInUntil < new Date()) {
      user.signedIn = false;
      user.signedInUntil = null;
      await user.save();
    }

    // ensure QR exists, generate if missing
    if (!user.qrCodeUrl && user.upiId) {
      try {
        const url = await generateQrAndUpload(user.upiId);
        user.qrCodeUrl = url;
        await user.save();
      } catch (e) {
        // ignore QR generation errors here
      }
    }

    res.json({
      mobile: user.mobile,
      username: user.username,
      upiId: user.upiId,
      signedIn: user.signedIn,
      signedInUntil: user.signedInUntil,
      qrCodeUrl: user.qrCodeUrl || null,
      balance: user.balance
    });
  } catch (err) {
    console.error('Status error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/qr/:mobile -> returns qrCodeUrl for the user's UPI, generates if missing
router.get('/qr/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.qrCodeUrl && user.upiId) {
      const url = await generateQrAndUpload(user.upiId);
      user.qrCodeUrl = url;
      await user.save();
    }

    res.json({ mobile: user.mobile, username: user.username, upiId: user.upiId, qrCodeUrl: user.qrCodeUrl });
  } catch (err) {
    console.error('QR fetch error', err);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// GET /auth/balance/:mobile -> only returns if signed in
router.get('/balance/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.signedIn || !user.signedInUntil || user.signedInUntil < new Date()) {
      return res.status(403).json({ error: 'Not signed in' });
    }
    // Fetch live balance from bank-service database
    const resp = await axios.get(`${BANK_BASE}/bank/balance/${encodeURIComponent(user.upiId)}`, { timeout: 8000 });
    const data = resp.data || {};
    res.json({ mobile: user.mobile, upiId: user.upiId, balance: data.balance });
  } catch (err) {
    console.error('Balance fetch error', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /auth/user/by-upi/:upiId -> fetch user basic info by upiId
router.get('/user/by-upi/:upiId', async (req, res) => {
  try {
    const { upiId } = req.params;
    const user = await User.findOne({ upiId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ mobile: user.mobile, username: user.username, upiId: user.upiId });
  } catch (err) {
    console.error('Get user by upi error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
