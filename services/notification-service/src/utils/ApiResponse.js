/**
 * Uniform Output Response Enforcer Blueprint for the JustTap Service Mesh Ingress Plane
 */
class ApiResponse {
  /**
   * @param {number} statusCode - Target HTTP compliance status execution signature (typically 200 or 201)
   * @param {any} data - Decoupled data object payload resolved by core repositories layer
   * @param {string} [message='Operation completed successfully.'] - Operational transaction outcome summary text
   */
  constructor(statusCode, data, message = "Operation completed successfully.") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

module.exports = ApiResponse;