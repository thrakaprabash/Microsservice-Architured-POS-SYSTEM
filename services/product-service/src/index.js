require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Product service is running', service: 'product-service' });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4002;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[product-service] Listening on port ${PORT}`);
  });
};

start();
