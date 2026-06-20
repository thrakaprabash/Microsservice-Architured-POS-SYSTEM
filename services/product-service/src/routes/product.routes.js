const { Router } = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require('../controllers/product.controller');

const router = Router();

/**
 * stockAuth – accepts EITHER:
 *   1. A valid x-service-secret header (internal microservice call), OR
 *   2. A valid admin JWT (cookie or Authorization header)
 */
const stockAuth = (req, res, next) => {
  if (
    req.headers['x-service-secret'] &&
    req.headers['x-service-secret'] === process.env.INTERNAL_SERVICE_SECRET
  ) {
    return next();
  }
  // Fall through to standard JWT + admin check
  return protect(req, res, () => adminOnly(req, res, next));
};

// GET /products  – any authenticated user
router.get('/', protect, getAllProducts);

// GET /products/:id  – any authenticated user
router.get('/:id', protect, getProductById);

// POST /products  – admin only
router.post('/', protect, adminOnly, createProduct);

// PATCH /products/:id  – admin only
router.patch('/:id', protect, adminOnly, updateProduct);

// DELETE /products/:id  – admin only
router.delete('/:id', protect, adminOnly, deleteProduct);

// PATCH /products/:id/stock  – internal service OR admin JWT
router.patch('/:id/stock', stockAuth, updateStock);

module.exports = router;
