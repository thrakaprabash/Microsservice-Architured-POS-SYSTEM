const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = Router();

// POST /register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'cashier'])
      .withMessage('Role must be admin or cashier'),
  ],
  register
);

// POST /login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// POST /logout  (protected – must be logged in)
router.post('/logout', protect, logout);

// GET /me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
