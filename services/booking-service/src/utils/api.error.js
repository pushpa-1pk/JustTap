class ApiError extends Error {
  /**
   * Instantiates a production-grade operational application exception context
   * @param {string} message - Human-readable contextual warning description
   * @param {number} statusCode - Target HTTP compliance status code
   * @param {Array<Object>} [errors=[]] - Granular field-level issue dictionaries
   */
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors; // Holds structured field level arrays (e.g. [{ field: 'x', message: '...' }])
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;