require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const transactionRoute = require('./routes/transaction');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('MONGO_URI missing in .env');
  process.exit(1);
}

mongoose.connect(MONGO)
  .then(() => console.log('Connected to Bank MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

app.use('/bank', transactionRoute);

app.get('/', (req, res) => res.json({ ok: true, service: 'bank-service' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Bank service listening on ${PORT}`));
