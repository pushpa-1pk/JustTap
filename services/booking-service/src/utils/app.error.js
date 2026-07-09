class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Flags known runtime failures from unhandled exceptions

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;