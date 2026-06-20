const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Generate a signed JWT for the given user.
 * @param {Object} user - Mongoose User document
 * @returns {string} signed JWT
 */
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/**
 * Set the JWT as an HTTP-only cookie on the response.
 * @param {Response} res
 * @param {string} token
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    secure: process.env.NODE_ENV === 'production',
  });
};

/**
 * POST /register
 * Register a new user account.
 */
const register = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, role } = req.body;

    // Ensure email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          token,
        },
      },
      message: 'Registration successful.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /login
 * Authenticate user and issue JWT.
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Explicitly select password since it has select: false on the schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          token,
        },
      },
      message: 'Login successful.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /logout
 * Clear the auth cookie.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /me
 * Return the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({
      success: true,
      data: { user },
      message: 'User profile retrieved.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
