exports.internalAuth = (req, res, next) => {
  if (req.headers['x-service-secret'] === process.env.INTERNAL_SERVICE_SECRET) return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
};
