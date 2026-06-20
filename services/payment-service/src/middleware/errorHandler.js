const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  // If a 3rd party library throws 401 (e.g. Stripe auth error), do not leak it as 401
  // because the frontend Axios interceptor will misinterpret it and log the user out.
  if (statusCode === 401 && err.type === 'StripeAuthenticationError') {
    statusCode = 500;
  }
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
