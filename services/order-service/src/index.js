require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/order.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/health', (req, res) =>
  res.json({ success: true, message: 'Order service is running' })
);

// Routes
app.use('/orders', orderRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4003;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Order service running on port ${PORT}`));
};

start();
