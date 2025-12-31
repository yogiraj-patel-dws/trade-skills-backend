const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * @swagger
 * /api/public/landingpage:
 *   get:
 *     summary: Get landing page data
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Landing page data retrieved successfully
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
 *                         analytics:
 *                           type: object
 *                           properties:
 *                             activeTeachers:
 *                               type: string
 *                             skillsExchanged:
 *                               type: string
 *                             communityRating:
 *                               type: number
 *                             countries:
 *                               type: string
 *                         popularSkills:
 *                           type: array
 *                           items:
 *                             type: object
 *                         whyTradeSkills:
 *                           type: object
 */
router.get('/landingpage', publicController.getLandingPage);

/**
 * @swagger
 * /api/public/community-stories:
 *   get:
 *     summary: Get community stories and testimonials
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Community stories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/community-stories', publicController.getCommunityStories);

/**
 * @swagger
 * /api/public/footer:
 *   get:
 *     summary: Get footer data
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Footer data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/footer', publicController.getFooter);

module.exports = router;