const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmCardPayment,
  processCashPayment,
  getPayment,
  getPaymentByOrder,
  handleStripeWebhook,
  getPaymentStats,
} = require('../controllers/payment.controller');

// Webhook: no auth, raw body is already set at app level for this path
router.post('/webhook', handleStripeWebhook);

// Stats: accept internal service secret OR JWT+admin
const statsAuth = (req, res, next) => {
  if (req.headers['x-service-secret'] === process.env.INTERNAL_SERVICE_SECRET) {
    return next();
  }
  return protect(req, res, err => {
    if (err) return next(err);
    return adminOnly(req, res, next);
  });
};

router.post('/intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmCardPayment);
router.post('/cash', protect, processCashPayment);
router.get('/stats', statsAuth, getPaymentStats);
router.get('/order/:orderId', protect, getPaymentByOrder);
router.get('/:id', protect, getPayment);

module.exports = router;
