/**
 * Standardized Operational and Functional Error Encapsulation Class for JustTap Microservices
 * Custom inheritance from Error primitive to cleanly route metrics across pipeline boundaries
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - Standard HTTP Status Code (e.g., 400, 404, 500)
   * @param {string} message - Descriptive error message intended for log transparency
   * @param {string} [errorCode='INTERNAL_SERVER_ERROR'] - Explicit business code string for mobile client mapping
   * @param {Array} [errors=[]] - Array detailing specific structural validation violations (e.g., from Joi)
   * @param {string} [stack=''] - Execution trace stack history override
   */
  constructor(
    statusCode,
    message = "An unhandled microservice error execution anomaly occurred.",
    errorCode = "INTERNAL_SERVER_ERROR",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.data = null;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;