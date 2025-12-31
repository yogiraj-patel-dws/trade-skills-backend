const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// Profile routes
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[+]?[1-9][\d]{0,15}$'
 *               timezone:
 *                 type: string
 *               availability:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.put('/me', validate(schemas.updateProfile), userController.updateMe);

// Skills routes
/**
 * @swagger
 * /api/users/skills:
 *   get:
 *     summary: Get user skills
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/skills', userController.getSkills);

/**
 * @swagger
 * /api/users/skills:
 *   post:
 *     summary: Add skill to user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillId
 *               - level
 *               - canTeach
 *               - wantsToLearn
 *             properties:
 *               skillId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the skill to add
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *                 description: User's proficiency level
 *               yearsOfExperience:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 description: Years of experience with this skill
 *               canTeach:
 *                 type: boolean
 *                 description: Whether user can teach this skill
 *               wantsToLearn:
 *                 type: boolean
 *                 description: Whether user wants to learn this skill
 *     responses:
 *       201:
 *         description: Skill added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or skill already exists
 */
router.post('/skills', validate(schemas.addSkill), userController.addSkill);

module.exports = router;