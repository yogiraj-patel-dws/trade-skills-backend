class ApiResponse {
  static success(data = null, message = 'Success', code = 200) {
    return {
      status: true,
      code,
      message,
      data
    };
  }
  
  static error(message = 'Error', code = 500, data = null) {
    return {
      status: false,
      code,
      message,
      data
    };
  }
}

module.exports = ApiResponse;