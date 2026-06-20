/**
 * Global Express error handler middleware.
 * Catches errors forwarded via next(err) and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[product-service] Error: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
