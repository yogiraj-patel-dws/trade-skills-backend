const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Get all skills
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in skill names and descriptions
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           description: { type: string }
 *                           category: { type: string }
 *                           isActive: { type: boolean }
 *                           createdAt: { type: string }
 *                           userSkills:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 level: { type: string }
 *                                 skillTitle: { type: string }
 *                                 bannerImage: { type: string }
 *                                 demoVideo: { type: string }
 *                                 teachingLanguage: { type: string }
 *                                 prerequisites: { type: string }
 *                                 subcategory: { type: string }
 */
router.get('/', skillController.getAllSkills);

/**
 * @swagger
 * /api/skills/categories:
 *   get:
 *     summary: Get skill categories
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', skillController.getCategories);

/**
 * @swagger
 * /api/skills/search:
 *   get:
 *     summary: Search skills
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved
 */
router.get('/search', skillController.searchSkills);

/**
 * @swagger
 * /api/skills/popular:
 *   get:
 *     summary: Get popular skills
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular skills retrieved
 */
router.get('/popular', skillController.getPopularSkills);

/**
 * @swagger
 * /api/skills/{id}:
 *   get:
 *     summary: Get skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill retrieved successfully
 *       404:
 *         description: Skill not found
 */
router.get('/:id', skillController.getSkillById);

/**
 * @swagger
 * /api/skills:
 *   post:
 *     summary: Create new skill (Admin only)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skill created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, authorize('ADMIN'), skillController.createSkill);

module.exports = router;