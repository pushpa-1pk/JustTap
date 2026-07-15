class ResponseHelper {
  static success(res, data = {}, message = 'Operation completed successfully.', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  static error(res, errorCode, developerMessage, status = 500, underlyingDetails = null) {
    const errorBody = {
      success: false,
      code: errorCode,
      message: developerMessage
    };
    
    if (underlyingDetails && process.env.NODE_ENV !== 'production') {
      errorBody.details = underlyingDetails;
    }
    
    return res.status(status).json(errorBody);
  }
}

module.exports = ResponseHelper;