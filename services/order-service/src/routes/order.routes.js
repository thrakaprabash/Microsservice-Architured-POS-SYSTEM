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

// Stats auth: accept internal service secret OR JWT
const statsAuth = (req, res, next) => {
  if (req.headers['x-service-secret'] === process.env.INTERNAL_SERVICE_SECRET) {
    return next();
  }
  return protect(req, res, next);
};

// IMPORTANT: stats routes registered BEFORE /:id to avoid conflicts
router.get('/stats/daily', statsAuth, getDailyStats);
router.get('/stats/weekly', statsAuth, getWeeklyStats);

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

module.exports = router;
