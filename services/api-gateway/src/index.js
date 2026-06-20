require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:80',
    'http://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-service-secret']
}));

// ─── Rate Limiter ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts.' }
});

// ─── Public Paths (no JWT required) ───────────────────────────────────────────
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/payments/webhook'
];

const isPublicPath = (path) => PUBLIC_PATHS.some(pub => path.startsWith(pub));

// ─── JWT Authentication Middleware ─────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  if (isPublicPath(req.path)) return next();

  // Extract token from cookie or Authorization header
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Forward user info to downstream services via headers
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-name'] = decoded.name;
    req.headers['x-user-email'] = decoded.email;
    // Forward internal service secret so services trust this gateway
    req.headers['x-service-secret'] = process.env.INTERNAL_SERVICE_SECRET;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

app.use(authMiddleware);

// ─── Proxy Error Handler ───────────────────────────────────────────────────────
const onProxyError = (serviceName) => (err, req, res) => {
  console.error(`[API Gateway] Proxy error for ${serviceName}:`, err.message);
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      message: `${serviceName} is temporarily unavailable. Please try again.`
    });
  }
};

// ─── Service URLs ──────────────────────────────────────────────────────────────
const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://auth-service:4001';
const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:4002';
const ORDER_URL   = process.env.ORDER_SERVICE_URL   || 'http://order-service:4003';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4004';
const REPORT_URL  = process.env.REPORT_SERVICE_URL  || 'http://report-service:4005';

// ─── Proxy Routes ──────────────────────────────────────────────────────────────

// Auth Service — /api/auth/* → auth-service
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: AUTH_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  on: { error: onProxyError('Auth Service') },
  logger: console
}));

// Product Service — /api/products/* and /api/categories/*
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/products' },
  on: { error: onProxyError('Product Service') }
}));

app.use('/api/categories', createProxyMiddleware({
  target: PRODUCT_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/categories': '/categories' },
  on: { error: onProxyError('Product Service') }
}));

// Order Service — /api/orders/*
app.use('/api/orders', createProxyMiddleware({
  target: ORDER_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' },
  on: { error: onProxyError('Order Service') }
}));

// Payment Service — /api/payments/* (webhook needs raw body, handled before json middleware)
app.use('/api/payments', createProxyMiddleware({
  target: PAYMENT_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/payments' },
  on: { error: onProxyError('Payment Service') }
}));

// Report Service — /api/reports/*
app.use('/api/reports', createProxyMiddleware({
  target: REPORT_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/reports': '/reports' },
  on: { error: onProxyError('Report Service') }
}));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      auth: AUTH_URL,
      product: PRODUCT_URL,
      order: ORDER_URL,
      payment: PAYMENT_URL,
      report: REPORT_URL
    }
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[API Gateway] Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on port ${PORT}`);
  console.log(`   Auth    → ${AUTH_URL}`);
  console.log(`   Product → ${PRODUCT_URL}`);
  console.log(`   Order   → ${ORDER_URL}`);
  console.log(`   Payment → ${PAYMENT_URL}`);
  console.log(`   Report  → ${REPORT_URL}\n`);
});
