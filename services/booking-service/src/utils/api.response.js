class ApiResponse {
  static success(res, statusCode = 200, message = 'Success', data = null, meta = null) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta
    });
  }

  static error(res, statusCode = 500, message = 'Something went wrong', errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }
}

module.exports = ApiResponse;
