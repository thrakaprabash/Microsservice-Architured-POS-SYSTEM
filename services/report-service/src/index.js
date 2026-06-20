require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/health', (req, res) =>
  res.json({ success: true, message: 'Report service is running' })
);

// Routes
app.use('/reports', reportRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4005;

app.listen(PORT, () => console.log(`Report service running on port ${PORT}`));
