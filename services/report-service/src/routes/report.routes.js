const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSummary,
  getDailyReport,
  getWeeklyReport,
  getTopProducts,
  getRevenueByMethod,
} = require('../controllers/report.controller');

router.get('/summary', protect, getSummary);
router.get('/daily', protect, getDailyReport);
router.get('/weekly', protect, getWeeklyReport);
router.get('/top-products', protect, getTopProducts);
router.get('/revenue-by-method', protect, getRevenueByMethod);

module.exports = router;
