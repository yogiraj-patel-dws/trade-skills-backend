const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(ApiResponse.success(result, 'User registered successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(ApiResponse.success(result, 'Login successful', 200));
    } catch (error) {
      res.status(401).json(ApiResponse.error(error.message, 401));
    }
  }
  
  async logout(req, res) {
    res.status(200).json(ApiResponse.success(null, 'Logout successful', 200));
  }
  
  async me(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);
      res.status(200).json(ApiResponse.success({ user }, 'User profile retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get user profile', 500));
    }
  }
}

module.exports = new AuthController();