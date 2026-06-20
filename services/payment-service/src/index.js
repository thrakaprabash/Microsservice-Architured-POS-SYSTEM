require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/payment.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// IMPORTANT: Stripe webhook requires the raw request body.
// This must be registered BEFORE express.json() middleware.
app.use('/payments/webhook', express.raw({ type: 'application/json' }));

// General JSON body parser (does not affect the webhook route above)
app.use(express.json());

// Health check
app.get('/health', (req, res) =>
  res.json({ success: true, message: 'Payment service is running' })
);

// Routes
app.use('/payments', paymentRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4004;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Payment service running on port ${PORT}`));
};

start();
