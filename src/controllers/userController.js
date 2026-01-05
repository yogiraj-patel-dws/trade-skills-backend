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
  
  async uploadMedia(req, res) {
    try {
      const files = req.files || {};
      const urls = {};
      
      if (files.bannerImage && files.bannerImage[0]) {
        urls.bannerImage = `/uploads/banners/${files.bannerImage[0].filename}`;
      }
      
      if (files.demoVideo && files.demoVideo[0]) {
        urls.demoVideo = `/uploads/videos/${files.demoVideo[0].filename}`;
      }
      
      if (Object.keys(urls).length === 0) {
        return res.status(400).json(ApiResponse.error('No files uploaded', 400));
      }
      
      res.status(200).json(ApiResponse.success(urls, 'Media uploaded successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
  
  async updateSkill(req, res) {
    try {
      const { id } = req.params;
      const userSkill = await userService.updateUserSkill(req.user.id, id, req.body);
      res.status(200).json(ApiResponse.success({ userSkill }, 'Skill updated successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
  
  async deleteSkill(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUserSkill(req.user.id, id);
      res.status(200).json(ApiResponse.success(result, 'Skill deleted successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
}

module.exports = new UserController();