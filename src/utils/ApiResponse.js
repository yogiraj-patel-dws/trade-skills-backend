class ApiResponse {
  static success(data = null, message = 'Success', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data
    };
  }
  
  static error(message = 'Error', statusCode = 500, data = null) {
    return {
      success: false,
      statusCode,
      message,
      data
    };
  }
}

module.exports = ApiResponse;