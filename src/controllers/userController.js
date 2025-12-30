const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');

class UserController {
  async getMe(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      res.status(200).json(ApiResponse.success({ user }, 'User profile retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get user profile', 500));
    }
  }
  
  async updateMe(req, res) {
    try {
      const profile = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json(ApiResponse.success({ profile }, 'Profile updated successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
  
  async addSkill(req, res) {
    try {
      const userSkill = await userService.addSkill(req.user.id, req.body);
      res.status(201).json(ApiResponse.success({ userSkill }, 'Skill added successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
  
  async getSkills(req, res) {
    try {
      const skills = await userService.getUserSkills(req.user.id);
      res.status(200).json(ApiResponse.success(skills, 'User skills retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get user skills', 500));
    }
  }
}

module.exports = new UserController();