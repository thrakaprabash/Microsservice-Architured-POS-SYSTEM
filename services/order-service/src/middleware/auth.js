const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};
