const { Router } = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
} = require('../controllers/user.controller');

const router = Router();

// All user management routes require authentication AND admin role
router.use(protect, adminOnly);

// GET /users
router.get('/', getAllUsers);

// GET /users/:id
router.get('/:id', getUserById);

// PATCH /users/:id
router.patch('/:id', updateUser);

// DELETE /users/:id  (soft-delete → sets isActive=false)
router.delete('/:id', deactivateUser);

module.exports = router;
