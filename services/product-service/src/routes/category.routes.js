const { Router } = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

const router = Router();

// GET /categories  – any authenticated user
router.get('/', protect, getAllCategories);

// GET /categories/:id  – any authenticated user
router.get('/:id', protect, getCategoryById);

// POST /categories  – admin only
router.post('/', protect, adminOnly, createCategory);

// PATCH /categories/:id  – admin only
router.patch('/:id', protect, adminOnly, updateCategory);

// DELETE /categories/:id  – admin only (blocked if active products exist)
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
