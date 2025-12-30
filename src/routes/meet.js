const express = require('express');
const router = express.Router();
const meetController = require('../controllers/meetController');
const { authenticate } = require('../middleware/auth');

// All meet routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/meet/create:
 *   post:
 *     summary: Create meeting room for session
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting room created
 *       400:
 *         description: Invalid session or unauthorized
 */
router.post('/create', meetController.createMeetingRoom);

/**
 * @swagger
 * /api/meet/{sessionId}:
 *   get:
 *     summary: Get meeting join details
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting join details retrieved
 *       400:
 *         description: Session not found or unauthorized
 */
router.get('/:sessionId', meetController.joinMeeting);

/**
 * @swagger
 * /api/meet/{sessionId}/start:
 *   post:
 *     summary: Start session (host only)
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session started
 *       400:
 *         description: Cannot start session
 */
router.post('/:sessionId/start', meetController.startSession);

/**
 * @swagger
 * /api/meet/{sessionId}/end:
 *   post:
 *     summary: End session (host only)
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended
 *       400:
 *         description: Cannot end session
 */
router.post('/:sessionId/end', meetController.endSession);

/**
 * @swagger
 * /api/meet/{sessionId}/attendance:
 *   post:
 *     summary: Record attendance (join/leave)
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [join, leave]
 *     responses:
 *       200:
 *         description: Attendance recorded
 */
router.post('/:sessionId/attendance', meetController.recordAttendance);

/**
 * @swagger
 * /api/meet/{sessionId}/stats:
 *   get:
 *     summary: Get session statistics
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session stats retrieved
 */
router.get('/:sessionId/stats', meetController.getSessionStats);

/**
 * @swagger
 * /api/meet/{sessionId}/recordings:
 *   get:
 *     summary: Get session recordings (100ms)
 *     tags: [Meet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session recordings retrieved
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
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startedAt:
 *                             type: string
 *                           duration:
 *                             type: number
 *                           location:
 *                             type: string
 */
router.get('/:sessionId/recordings', meetController.getRecordings);

module.exports = router;
