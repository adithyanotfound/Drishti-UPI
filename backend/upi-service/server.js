require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('MONGO_URI missing in .env');
  process.exit(1);
}

mongoose.connect(MONGO)
  .then(() => console.log('Connected to UPI MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);

app.get('/', (req, res) => res.json({ ok: true, service: 'upi-service' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UPI service listening on ${PORT}`));
