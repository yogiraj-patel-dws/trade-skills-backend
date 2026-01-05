const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserSkill'
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
 *               - skillTitle
 *             properties:
 *               skillId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the skill to add
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *                 description: User's proficiency level
 *               skillTitle:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *                 description: Custom title for teaching
 *               bannerImage:
 *                 type: string
 *                 format: uri
 *                 description: Banner image URL for teaching profile
 *               demoVideo:
 *                 type: string
 *                 format: uri
 *                 description: Demo video URL for teaching profile
 *               teachingLanguage:
 *                 type: string
 *                 maxLength: 100
 *                 description: Languages for teaching (e.g. "English, Spanish")
 *               prerequisites:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Prerequisites and requirements for learners
 *               subcategory:
 *                 type: string
 *                 maxLength: 50
 *                 description: Subcategory within the skill category
 *     responses:
 *       201:
 *         description: Skill added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         userSkill:
 *                           $ref: '#/components/schemas/UserSkill'
 *       400:
 *         description: Validation error or skill already exists
 */
router.post('/skills', validate(schemas.addSkill), userController.addSkill);

/**
 * @swagger
 * /api/users/upload-media:
 *   post:
 *     summary: Upload banner image and demo video
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image (JPG, PNG, max 5MB)
 *               demoVideo:
 *                 type: string
 *                 format: binary
 *                 description: Demo video (MP4, WebM, max 50MB)
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MediaUploadResponse'
 *       400:
 *         description: Invalid file type or size
 */
router.post('/upload-media', 
  upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'demoVideo', maxCount: 1 }
  ]), 
  userController.uploadMedia
);

// Update skill
router.put('/skills/:id', userController.updateSkill);

// Delete skill
router.delete('/skills/:id', userController.deleteSkill);

module.exports = router;