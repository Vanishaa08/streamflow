import env from '../config/env.js';

// Custom error class for operational errors
// Operational = expected errors (invalid input, not found, unauthorized)
// vs Programmer errors (bugs, type errors) which should crash the process
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Log error details
  if (err.statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}`, {
      message: err.message,
      stack: env.isDev ? err.stack : undefined,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      data: null,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      data: null,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      data: null,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      data: null,
    });
  }

  // Default error response
  res.status(err.statusCode).json({
    success: false,
    message: env.isDev ? err.message : 
      err.isOperational ? err.message : 'Internal server error',
    data: null,
  });
};