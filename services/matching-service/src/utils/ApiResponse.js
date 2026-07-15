class ApiResponse {
  constructor(statusCode, message, data = {}) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data
    });
  }
}

module.exports = ApiResponse;