const express = require('express');
const router = express.Router();
const meetController = require('../controllers/meetController');
const { authenticate } = require('../middleware/auth');

// All meet routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/meet/create-room:
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
router.post('/create-room', meetController.createMeetingRoom);

/**
 * @swagger
 * /api/meet/join/{sessionId}:
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
router.get('/join/:sessionId', meetController.joinMeeting);

/**
 * @swagger
 * /api/meet/start/{sessionId}:
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
router.post('/start/:sessionId', meetController.startSession);

/**
 * @swagger
 * /api/meet/end/{sessionId}:
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
router.post('/end/:sessionId', meetController.endSession);

/**
 * @swagger
 * /api/meet/attendance/{sessionId}:
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
router.post('/attendance/:sessionId', meetController.recordAttendance);

/**
 * @swagger
 * /api/meet/stats/{sessionId}:
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
router.get('/stats/:sessionId', meetController.getSessionStats);

/**
 * @swagger
 * /api/meet/recordings/{sessionId}:
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
 */
router.get('/recordings/:sessionId', meetController.getRecordings);

module.exports = router;
