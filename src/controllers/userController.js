const userService = require('../services/userService');

class UserController {
  async getMe(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      
      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }
  
  async updateMe(req, res) {
    try {
      const profile = await userService.updateProfile(req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { profile }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async addSkill(req, res) {
    try {
      const userSkill = await userService.addSkill(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Skill added successfully',
        data: { userSkill }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getSkills(req, res) {
    try {
      const skills = await userService.getUserSkills(req.user.id);
      
      res.status(200).json({
        success: true,
        data: { skills }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user skills'
      });
    }
  }
}

module.exports = new UserController();