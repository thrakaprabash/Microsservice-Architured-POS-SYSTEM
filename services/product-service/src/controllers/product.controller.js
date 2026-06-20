const Product = require('../models/Product');

/**
 * GET /products
 * Retrieve all products with optional search, category filter, and isActive filter.
 * Supports pagination via ?page=1&limit=50
 */
const getAllProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      isActive,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      message: 'Products retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/:id
 * Retrieve a single product by ID, with category populated.
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name icon');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.json({
      success: true,
      data: { product },
      message: 'Product retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /products
 * Create a new product. Admin only.
 * Auto-generates SKU if not provided.
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, sku, barcode, image, isActive, unit } =
      req.body;

    const productData = {
      name,
      description,
      price,
      category,
      stock,
      barcode,
      image,
      isActive,
      unit,
      sku: sku || `PRD-${Date.now()}`,
    };

    const product = await Product.create(productData);
    await product.populate('category', 'name icon');

    return res.status(201).json({
      success: true,
      data: { product },
      message: 'Product created successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /products/:id
 * Update product fields. Admin only.
 */
const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'description', 'price', 'category', 'barcode', 'image', 'isActive', 'unit', 'sku', 'stock'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name icon');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({
      success: true,
      data: { product },
      message: 'Product updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /products/:id
 * Delete a product permanently. Admin only.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({
      success: true,
      data: null,
      message: 'Product deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /products/:id/stock
 * Update stock level. Accepts x-service-secret (internal) OR admin JWT.
 * Body: { quantity: Number, operation: 'add' | 'subtract' }
 */
const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;

    if (quantity === undefined || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Body must include quantity (number) and operation (add|subtract).',
      });
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a non-negative number.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (operation === 'subtract') {
      if (product.stock - numQty < 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, requested: ${numQty}.`,
        });
      }
      product.stock -= numQty;
    } else {
      product.stock += numQty;
    }

    await product.save();
    await product.populate('category', 'name icon');

    return res.json({
      success: true,
      data: { product },
      message: `Stock ${operation === 'add' ? 'added' : 'subtracted'} successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
};
