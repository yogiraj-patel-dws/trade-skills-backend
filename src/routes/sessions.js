const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All session routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSessionRequest'
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(schemas.createSession), sessionController.createSession);

/**
 * @swagger
 * /api/sessions/my:
 *   get:
 *     summary: Get user's sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, hosted, joined]
 *           default: all
 *     responses:
 *       200:
 *         description: User sessions retrieved
 */
router.get('/my', sessionController.getUserSessions);

/**
 * @swagger
 * /api/sessions/public:
 *   get:
 *     summary: Get public available sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skillId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionType
 *         schema:
 *           type: string
 *           enum: [ONE_ON_ONE, ONE_TO_MANY]
 *     responses:
 *       200:
 *         description: Public sessions retrieved
 */
router.get('/public', sessionController.getPublicSessions);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *       404:
 *         description: Session not found
 */
router.get('/:id', sessionController.getSessionById);

/**
 * @swagger
 * /api/sessions/{id}/join:
 *   post:
 *     summary: Join a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined session
 *       400:
 *         description: Cannot join session (insufficient credits, full, etc.)
 */
router.post('/:id/join', sessionController.joinSession);

/**
 * @swagger
 * /api/sessions/{id}/cancel:
 *   post:
 *     summary: Cancel a session (host only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *       400:
 *         description: Cannot cancel session
 */
router.post('/:id/cancel', sessionController.cancelSession);

/**
 * @swagger
 * /api/sessions/{id}/complete:
 *   post:
 *     summary: Complete a session (host only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session completed successfully
 *       400:
 *         description: Cannot complete session
 */
router.post('/:id/complete', sessionController.completeSession);

module.exports = router;
