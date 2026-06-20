const jwt = require('jsonwebtoken');

/**
 * protect – verifies JWT from HTTP-only cookie OR Authorization Bearer header.
 * Sets req.user to the decoded payload { id, name, email, role }.
 */
const protect = (req, res, next) => {
  try {
    let token;

    // Prefer cookie, fall back to Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};

/**
 * adminOnly – must be used after protect.
 * Permits only users with role === 'admin'.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

module.exports = { protect, adminOnly };
