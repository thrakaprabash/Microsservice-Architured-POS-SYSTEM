const axios = require('axios');
const Order = require('../models/Order');

const productServiceClient = axios.create({
  headers: { 'x-service-secret': process.env.INTERNAL_SERVICE_SECRET },
});

// POST /orders
exports.createOrder = async (req, res, next) => {
  try {
    const { items, notes = '', discount = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error('Items array is required and must not be empty');
      err.statusCode = 400;
      return next(err);
    }

    // Fetch product details and validate
    const enrichedItems = [];
    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity < 1) {
        const err = new Error('Each item must have a valid productId and quantity >= 1');
        err.statusCode = 400;
        return next(err);
      }

      let product;
      try {
        const response = await productServiceClient.get(
          `${process.env.PRODUCT_SERVICE_URL}/products/${productId}`
        );
        product = response.data.data.product;
      } catch (e) {
        console.error('Error fetching product:', e.message, e.response?.data);
        const err = new Error(`Product ${productId} not found or unavailable. Reason: ${e.message}`);
        err.statusCode = 400;
        return next(err);
      }

      if (!product || !product.isActive) {
        const err = new Error(`Product ${productId} is not available`);
        err.statusCode = 400;
        return next(err);
      }

      const subtotal = parseFloat((product.price * quantity).toFixed(2));
      enrichedItems.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        subtotal,
      });
    }

    // Calculate totals
    const subtotal = parseFloat(
      enrichedItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
    );
    const tax = 0;
    const total = parseFloat((subtotal + tax - discount).toFixed(2));

    if (total < 0) {
      const err = new Error('Total cannot be negative');
      err.statusCode = 400;
      return next(err);
    }

    // Decrement stock for each item
    const stockUpdates = [];
    for (const item of enrichedItems) {
      try {
        await productServiceClient.patch(
          `${process.env.PRODUCT_SERVICE_URL}/products/${item.productId}/stock`,
          { quantity: item.quantity, operation: 'subtract' }
        );
        stockUpdates.push(item.productId);
      } catch (e) {
        // Rollback already updated stock
        for (const updatedId of stockUpdates) {
          const rollbackItem = enrichedItems.find(i => i.productId === updatedId);
          await productServiceClient
            .patch(`${process.env.PRODUCT_SERVICE_URL}/products/${updatedId}/stock`, {
              quantity: rollbackItem.quantity,
              operation: 'add',
            })
            .catch(() => {});
        }
        const err = new Error(
          `Failed to update stock for product ${item.productId}: ${e.response?.data?.message || e.message}`
        );
        err.statusCode = 400;
        return next(err);
      }
    }

    // Create order
    let order;
    try {
      order = await Order.create({
        cashier: { id: req.user.id, name: req.user.name },
        items: enrichedItems,
        subtotal,
        tax,
        discount,
        total,
        notes,
      });
    } catch (dbErr) {
      // Rollback stock updates if order creation fails
      for (const updatedId of stockUpdates) {
        const rollbackItem = enrichedItems.find(i => i.productId === updatedId);
        await productServiceClient
          .patch(`${process.env.PRODUCT_SERVICE_URL}/products/${updatedId}/stock`, {
            quantity: rollbackItem.quantity,
            operation: 'add',
          })
          .catch(() => {}); // ignore rollback errors
      }
      return next(dbErr);
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /orders
exports.getOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, cashierId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (cashierId) filter['cashier.id'] = cashierId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// PATCH /orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentId, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      return next(err);
    }

    const previousStatus = order.status;
    order.status = status;
    if (paymentId) order.paymentId = paymentId;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    // If cancelling, restore stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        await productServiceClient
          .patch(`${process.env.PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
            quantity: item.quantity,
            operation: 'add',
          })
          .catch(e =>
            console.error(`Failed to restore stock for ${item.productId}:`, e.message)
          );
      }
    }

    await order.save();
    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};

// GET /orders/stats/daily  (internal or protected)
exports.getDailyStats = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [allOrders, completedOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed',
      }),
    ]);

    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    // Hourly breakdown
    const hourMap = {};
    for (let h = 0; h < 24; h++) hourMap[h] = { hour: h, count: 0, revenue: 0 };

    for (const order of completedOrders) {
      const hour = new Date(order.createdAt).getHours();
      hourMap[hour].count++;
      hourMap[hour].revenue = parseFloat((hourMap[hour].revenue + order.total).toFixed(2));
    }

    res.json({
      success: true,
      data: {
        date: dateStr,
        totalOrders: allOrders.length,
        completedOrders: completedOrders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalItems,
        cancelledOrders,
        ordersByHour: Object.values(hourMap),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /orders/stats/weekly  (internal or protected)
exports.getWeeklyStats = async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [dailyAgg, topProductsAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', orders: 1, revenue: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, productId: '$_id', name: 1, quantity: 1, revenue: 1 } },
      ]),
    ]);

    const totalRevenue = dailyAgg.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = dailyAgg.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue =
      totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        days: dailyAgg,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue,
        topProducts: topProductsAgg,
      },
    });
  } catch (err) {
    next(err);
  }
};
