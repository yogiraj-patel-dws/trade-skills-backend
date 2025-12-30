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
  
  // User profile schemas
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    bio: Joi.string().max(500),
    phoneNumber: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/),
    timezone: Joi.string(),
    availability: Joi.object()
  }),
  
  // Session schemas
  createSession: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().max(1000),
    skillId: Joi.string().uuid(),
    sessionType: Joi.string().valid('ONE_ON_ONE', 'ONE_TO_MANY').required(),
    maxParticipants: Joi.number().min(1).max(100),
    creditCost: Joi.number().min(1).required(),
    scheduledAt: Joi.date().greater('now').required(),
    duration: Joi.number().min(15).max(480).required() // 15 minutes to 8 hours
  }),
  
  // Skill schemas
  addSkill: Joi.object({
    skillId: Joi.string().uuid().required(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').required(),
    yearsOfExperience: Joi.number().min(0).max(50),
    canTeach: Joi.boolean().required(),
    wantsToLearn: Joi.boolean().required()
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