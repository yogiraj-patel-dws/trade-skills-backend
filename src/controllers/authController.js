const authService = require('../services/authService');
const { OAuth2Client } = require('google-auth-library');
const ApiResponse = require('../utils/ApiResponse');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  async googleLogin(req, res) {
    try {
      const { token } = req.body;
      
      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;
      
      // Check if user exists or create new user
      const result = await authService.googleLogin({
        email,
        name,
        picture,
        googleId
      });
      
      res.status(200).json(ApiResponse.success(result, 'Google login successful', 200));
    } catch (error) {
      res.status(401).json(ApiResponse.error(error.message, 401));
    }
  }
}

module.exports = new AuthController();