const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/me', userController.getMe);
router.put('/me', validate(schemas.updateProfile), userController.updateMe);

// Skills routes
router.get('/skills', userController.getSkills);
router.post('/skills', validate(schemas.addSkill), userController.addSkill);

module.exports = router;