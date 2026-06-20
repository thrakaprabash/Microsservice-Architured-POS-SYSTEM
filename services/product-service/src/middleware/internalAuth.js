/**
 * internalAuth – validates that the request comes from a trusted internal service
 * by checking the x-service-secret header against INTERNAL_SERVICE_SECRET env var.
 */
const internalAuth = (req, res, next) => {
  const secret = req.headers['x-service-secret'];

  if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Invalid or missing service secret.',
    });
  }

  next();
};

module.exports = internalAuth;
