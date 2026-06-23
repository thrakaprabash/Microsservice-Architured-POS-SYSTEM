const axios = require('axios');

// Axios instance with internal service secret for service-to-service calls
const serviceClient = axios.create({
  headers: { 'x-service-secret': process.env.INTERNAL_SERVICE_SECRET },
});

const getToday = () => new Date().toISOString().split('T')[0];

const getLastNDays = n => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

// GET /reports/summary
exports.getSummary = async (req, res, next) => {
  try {
    const today = getToday();

    const [orderRes, paymentRes] = await Promise.all([
      serviceClient.get(
        `${process.env.ORDER_SERVICE_URL}/orders/stats/daily?date=${today}`
      ),
      serviceClient.get(
        `${process.env.PAYMENT_SERVICE_URL}/payments/stats?startDate=${today}&endDate=${today}`
      ),
    ]);

    const orderStats = orderRes.data.data;
    const paymentStats = paymentRes.data.data;

    res.json({
      success: true,
      data: {
        today: {
          orders: orderStats.totalOrders,
          revenue: orderStats.totalRevenue,
          completedOrders: orderStats.completedOrders,
          cancelledOrders: orderStats.cancelledOrders,
          totalItems: orderStats.totalItems,
        },
        payments: {
          cardRevenue: paymentStats.cardRevenue,
          cashRevenue: paymentStats.cashRevenue,
          cardCount: paymentStats.cardCount,
          cashCount: paymentStats.cashCount,
          totalRevenue: paymentStats.totalRevenue,
        },
      },
    });
  } catch (err) {
    const error = new Error(err.response?.data?.message || err.message);
    error.statusCode = err.response?.status || 500;
    next(error);
  }
};

// GET /reports/daily
exports.getDailyReport = async (req, res, next) => {
  try {
    const date = req.query.date || getToday();

    const [orderRes, paymentRes] = await Promise.all([
      serviceClient.get(
        `${process.env.ORDER_SERVICE_URL}/orders/stats/daily?date=${date}`
      ),
      serviceClient.get(
        `${process.env.PAYMENT_SERVICE_URL}/payments/stats?startDate=${date}&endDate=${date}`
      ),
    ]);

    const orderStats = orderRes.data.data;
    const paymentStats = paymentRes.data.data;

    res.json({
      success: true,
      data: {
        date,
        orders: {
          total: orderStats.totalOrders,
          completed: orderStats.completedOrders,
          cancelled: orderStats.cancelledOrders,
          totalItems: orderStats.totalItems,
          totalRevenue: orderStats.totalRevenue,
        },
        payments: {
          totalRevenue: paymentStats.totalRevenue,
          cardRevenue: paymentStats.cardRevenue,
          cashRevenue: paymentStats.cashRevenue,
          cardCount: paymentStats.cardCount,
          cashCount: paymentStats.cashCount,
        },
        hourlyBreakdown: orderStats.ordersByHour,
      },
    });
  } catch (err) {
    const error = new Error(err.response?.data?.message || err.message);
    error.statusCode = err.response?.status || 500;
    next(error);
  }
};

// GET /reports/weekly
exports.getWeeklyReport = async (req, res, next) => {
  try {
    const { startDate, endDate } =
      req.query.startDate && req.query.endDate
        ? { startDate: req.query.startDate, endDate: req.query.endDate }
        : getLastNDays(7);

    const [orderRes, paymentRes] = await Promise.all([
      serviceClient.get(
        `${process.env.ORDER_SERVICE_URL}/orders/stats/weekly?startDate=${startDate}&endDate=${endDate}`
      ),
      serviceClient.get(
        `${process.env.PAYMENT_SERVICE_URL}/payments/stats?startDate=${startDate}&endDate=${endDate}`
      ),
    ]);

    const orderStats = orderRes.data.data;
    const paymentStats = paymentRes.data.data;

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        days: orderStats.days,
        totals: {
          totalRevenue: orderStats.totalRevenue,
          totalOrders: orderStats.totalOrders,
          avgOrderValue: orderStats.avgOrderValue,
        },
        paymentSplit: {
          cardRevenue: paymentStats.cardRevenue,
          cashRevenue: paymentStats.cashRevenue,
          cardCount: paymentStats.cardCount,
          cashCount: paymentStats.cashCount,
        },
        topProducts: orderStats.topProducts,
      },
    });
  } catch (err) {
    const error = new Error(err.response?.data?.message || err.message);
    error.statusCode = err.response?.status || 500;
    next(error);
  }
};

// GET /reports/top-products
exports.getTopProducts = async (req, res, next) => {
  try {
    const startDate = req.query.startDate || getLastNDays(30).startDate;
    const endDate = req.query.endDate || getLastNDays(30).endDate;

    const orderRes = await serviceClient.get(
      `${process.env.ORDER_SERVICE_URL}/orders/stats/weekly?startDate=${startDate}&endDate=${endDate}`
    );

    const topProducts = orderRes.data.data.topProducts || [];

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        topProducts,
      },
    });
  } catch (err) {
    const error = new Error(err.response?.data?.message || err.message);
    error.statusCode = err.response?.status || 500;
    next(error);
  }
};

// GET /reports/revenue-by-method
exports.getRevenueByMethod = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let url = `${process.env.PAYMENT_SERVICE_URL}/payments/stats`;
    if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;

    const paymentRes = await serviceClient.get(url);
    const stats = paymentRes.data.data;

    res.json({
      success: true,
      data: {
        card: { revenue: stats.cardRevenue, count: stats.cardCount },
        cash: { revenue: stats.cashRevenue, count: stats.cashCount },
        total: { revenue: stats.totalRevenue, count: stats.completedPayments },
      },
    });
  } catch (err) {
    const error = new Error(err.response?.data?.message || err.message);
    error.statusCode = err.response?.status || 500;
    next(error);
  }
};
