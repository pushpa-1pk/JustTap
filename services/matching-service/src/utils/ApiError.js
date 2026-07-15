class ApiError extends Error {
  constructor(message, statusCode, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;