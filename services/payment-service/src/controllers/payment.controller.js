const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const Payment = require('../models/Payment');

const orderServiceClient = axios.create({
  headers: { 'x-service-secret': process.env.INTERNAL_SERVICE_SECRET },
});

// POST /payments/intent
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount || amount <= 0) {
      const err = new Error('orderId and a positive amount are required');
      err.statusCode = 400;
      return next(err);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert LKR to cents
      currency: 'lkr',
      metadata: { orderId },
    });

    const payment = await Payment.create({
      orderId,
      amount,
      method: 'card',
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      status: 'pending',
      processedBy: { id: req.user.id, name: req.user.name },
    });

    res.status(201).json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret, paymentId: payment._id },
      message: 'Payment intent created',
    });
  } catch (err) {
    next(err);
  }
};

// POST /payments/confirm
exports.confirmCardPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      const err = new Error('paymentIntentId is required');
      err.statusCode = 400;
      return next(err);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      const err = new Error('Payment record not found');
      err.statusCode = 404;
      return next(err);
    }

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      await payment.save();

      await orderServiceClient
        .patch(`${process.env.ORDER_SERVICE_URL}/orders/${payment.orderId}/status`, {
          status: 'completed',
          paymentId: payment._id.toString(),
          paymentMethod: 'card',
        })
        .catch(e => console.error('Failed to update order status:', e.message));
    } else {
      payment.status = 'failed';
      await payment.save();
    }

    res.json({ success: true, data: { payment }, message: 'Payment status confirmed' });
  } catch (err) {
    next(err);
  }
};

// POST /payments/cash
exports.processCashPayment = async (req, res, next) => {
  try {
    const { orderId, amount, cashReceived } = req.body;

    if (!orderId || amount === undefined || cashReceived === undefined) {
      const err = new Error('orderId, amount, and cashReceived are required');
      err.statusCode = 400;
      return next(err);
    }

    if (cashReceived < amount) {
      const err = new Error(
        `Insufficient cash received. Required: ${amount} LKR, received: ${cashReceived} LKR`
      );
      err.statusCode = 400;
      return next(err);
    }

    const changeGiven = parseFloat((cashReceived - amount).toFixed(2));

    const payment = await Payment.create({
      orderId,
      amount,
      method: 'cash',
      status: 'completed',
      cashReceived,
      changeGiven,
      processedBy: { id: req.user.id, name: req.user.name },
    });

    await orderServiceClient
      .patch(`${process.env.ORDER_SERVICE_URL}/orders/${orderId}/status`, {
        status: 'completed',
        paymentId: payment._id.toString(),
        paymentMethod: 'cash',
      })
      .catch(e => console.error('Failed to update order status:', e.message));

    res.status(201).json({
      success: true,
      data: { payment, changeGiven },
      message: 'Cash payment processed successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /payments/:id
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// GET /payments/order/:orderId
exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      const err = new Error('Payment not found for this order');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// POST /payments/webhook  (no auth - verified by Stripe signature)
exports.handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment && payment.status !== 'completed') {
          payment.status = 'completed';
          await payment.save();
          await orderServiceClient
            .patch(`${process.env.ORDER_SERVICE_URL}/orders/${payment.orderId}/status`, {
              status: 'completed',
              paymentId: payment._id.toString(),
              paymentMethod: 'card',
            })
            .catch(e => console.error('Order update failed:', e.message));
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment) {
          payment.status = 'failed';
          await payment.save();
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

// GET /payments/stats  (internal or admin)
exports.getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchFilter = { status: 'completed' };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const stats = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$method',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalRevenue: 0,
      cardRevenue: 0,
      cashRevenue: 0,
      cardCount: 0,
      cashCount: 0,
      completedPayments: 0,
    };

    for (const s of stats) {
      result.completedPayments += s.count;
      result.totalRevenue += s.revenue;
      if (s._id === 'card') {
        result.cardRevenue = parseFloat(s.revenue.toFixed(2));
        result.cardCount = s.count;
      } else if (s._id === 'cash') {
        result.cashRevenue = parseFloat(s.revenue.toFixed(2));
        result.cashCount = s.count;
      }
    }
    result.totalRevenue = parseFloat(result.totalRevenue.toFixed(2));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
