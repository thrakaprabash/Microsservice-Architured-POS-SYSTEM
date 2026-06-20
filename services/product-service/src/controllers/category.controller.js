const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * GET /categories
 * Retrieve all active categories.
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.json({
      success: true,
      data: { categories, count: categories.length },
      message: 'Categories retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /categories/:id
 * Retrieve a single category by ID.
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.json({
      success: true,
      data: { category },
      message: 'Category retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /categories
 * Create a new category. Admin only.
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const category = await Category.create({ name, description, icon });
    return res.status(201).json({
      success: true,
      data: { category },
      message: 'Category created successfully.',
    });
  } catch (err) {
    // Handle duplicate name (unique index violation)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Category name already exists.' });
    }
    next(err);
  }
};

/**
 * PATCH /categories/:id
 * Update a category. Admin only.
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (isActive !== undefined) updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({
      success: true,
      data: { category },
      message: 'Category updated successfully.',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Category name already exists.' });
    }
    next(err);
  }
};

/**
 * DELETE /categories/:id
 * Permanently delete a category. Admin only.
 * Blocked if any active products reference this category.
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Guard: do not delete if active products depend on this category
    const activeProductCount = await Product.countDocuments({
      category: req.params.id,
      isActive: true,
    });

    if (activeProductCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${activeProductCount} active product(s) are assigned to it.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      data: null,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
