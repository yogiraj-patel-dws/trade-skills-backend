const skillService = require('../services/skillService');
const ApiResponse = require('../utils/ApiResponse');

class SkillController {
  async getAllSkills(req, res) {
    try {
      const { category, search } = req.query;
      const skills = await skillService.getAllSkills({ category, search });
      
      res.status(200).json(ApiResponse.success(skills, 'Skills retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error(`Failed to get skills: ${error.message}`, 500));
    }
  }

  async getSkillById(req, res) {
    try {
      const { id } = req.params;
      const skill = await skillService.getSkillById(id);
      
      if (!skill) {
        return res.status(404).json(ApiResponse.error('Skill not found', 404));
      }
      
      res.status(200).json(ApiResponse.success(skill, 'Skill retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get skill', 500));
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await skillService.getSkillCategories();
      res.status(200).json(ApiResponse.success(categories, 'Categories retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get categories', 500));
    }
  }

  async searchSkills(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json(ApiResponse.error('Search query must be at least 2 characters', 400));
      }
      
      const skills = await skillService.searchSkills(q);
      res.status(200).json(ApiResponse.success(skills, 'Search results retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Search failed', 500));
    }
  }

  async getPopularSkills(req, res) {
    try {
      const { limit = 10 } = req.query;
      const skills = await skillService.getPopularSkills(parseInt(limit));
      
      res.status(200).json(ApiResponse.success(skills, 'Popular skills retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get popular skills', 500));
    }
  }

  async createSkill(req, res) {
    try {
      const skill = await skillService.createSkill(req.body);
      res.status(201).json(ApiResponse.success(skill, 'Skill created successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
}

module.exports = new SkillController();