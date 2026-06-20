const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDailyStats,
  getWeeklyStats,
} = require('../controllers/order.controller');

// Auth: accept internal service secret OR JWT
const serviceOrProtect = (req, res, next) => {
  if (req.headers['x-service-secret'] === process.env.INTERNAL_SERVICE_SECRET) {
    return next();
  }
  return protect(req, res, next);
};

// IMPORTANT: stats routes registered BEFORE /:id to avoid conflicts
router.get('/stats/daily', serviceOrProtect, getDailyStats);
router.get('/stats/weekly', serviceOrProtect, getWeeklyStats);

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', serviceOrProtect, updateOrderStatus);

module.exports = router;
