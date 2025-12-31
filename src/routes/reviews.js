const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All review routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reviews/{userId}:
 *   post:
 *     summary: Submit a review for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user being reviewed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review comment
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional session ID this review is for
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or review already exists
 */
router.post('/:userId', validate(schemas.createReview), reviewController.createReview);

/**
 * @swagger
 * /api/reviews/{userId}:
 *   get:
 *     summary: Get reviews for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user whose reviews to fetch
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                           rating: { type: integer }
 *                           comment: { type: string }
 *                           createdAt: { type: string }
 *                           sender:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               profile:
 *                                 type: object
 *                                 properties:
 *                                   firstName: { type: string }
 *                                   lastName: { type: string }
 *                                   profilePicture: { type: string }
 */
router.get('/:userId', reviewController.getUserReviews);

module.exports = router;