const User = require('../models/User');

/**
 * GET /users
 * Retrieve all users. Supports optional ?isActive=true|false query filter.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { users, count: users.length },
      message: 'Users retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users/:id
 * Retrieve a single user by ID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: { user },
      message: 'User retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/:id
 * Update a user's name, role, or isActive status.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;

    // Only allow specific fields to be updated
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (role !== undefined) updatePayload.role = role;
    if (isActive !== undefined) updatePayload.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: { user },
      message: 'User updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /users/:id
 * Soft-delete a user by setting isActive = false.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: null,
      message: 'User deactivated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users
 * Create a new user (Admin only).
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const user = await User.create({ name, email, password, role });

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
        },
      },
      message: 'User created successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, createUser };
