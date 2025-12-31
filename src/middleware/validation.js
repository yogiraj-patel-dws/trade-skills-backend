const Joi = require('joi');
const ApiResponse = require('../utils/ApiResponse');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json(ApiResponse.error('Validation Error', 400, errors));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  }),
  
  // User profile schemas
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    phoneNumber: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/).optional(),
    timezone: Joi.string().optional(),
    availability: Joi.object().optional()
  }),
  
  // Session schemas
  createSession: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    skillId: Joi.string().uuid().required(),
    duration: Joi.number().min(15).max(480).required(),
    creditsRequired: Joi.number().min(1).required(),
    scheduledAt: Joi.date().iso().required()
  }),
  
  // Skill schemas
  addSkill: Joi.object({
    skillId: Joi.string().uuid().required(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').required(),
    
    // Teaching-specific fields
    skillTitle: Joi.string().min(5).max(100).required(),
    bannerImage: Joi.string().uri().optional(),
    demoVideo: Joi.string().uri().optional(),
    teachingLanguage: Joi.string().max(100).optional(),
    prerequisites: Joi.string().max(1000).optional(),
    subcategory: Joi.string().max(50).optional()
  }),
  
  // Review schemas
  createReview: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500)
  }),
  
  // Report schemas
  createReport: Joi.object({
    type: Joi.string().valid('INAPPROPRIATE_BEHAVIOR', 'SPAM', 'FRAUD', 'TECHNICAL_ISSUE', 'OTHER').required(),
    reason: Joi.string().min(10).max(100).required(),
    description: Joi.string().max(1000),
    reportedUserId: Joi.string().uuid(),
    sessionId: Joi.string().uuid()
  })
};

module.exports = {
  validate,
  schemas
};