const errorHandler = (err, req, res, next) => {
  // If error is a string (Cloudinary, Razorpay etc)
  if (typeof err === "string") {
    return res.status(500).json({
      success: false,
      message: err,
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
  });
};

export default errorHandler;